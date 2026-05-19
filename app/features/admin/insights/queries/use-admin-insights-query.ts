import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type {
  AdminAIInsightsFilters,
  AdminAIInsightsList,
} from "~/features/admin/insights/model/admin-insight";
import {
  type AdminInsightsClient,
  useAdminInsightsClient,
} from "~/features/admin/insights/services/admin-insights.client";

export const ADMIN_INSIGHTS_QUERY_KEY = ["admin", "ai-insights"] as const;

/**
 * Builds a stable query key for the admin AI insights list.
 *
 * @param filters Current list filters.
 * @returns Stable Vue Query key.
 */
export const adminInsightsListQueryKey = (
  filters: AdminAIInsightsFilters,
): readonly unknown[] => [
  ...ADMIN_INSIGHTS_QUERY_KEY,
  "list",
  {
    search: filters.search ?? "",
    status: filters.status ?? "all",
    model: filters.model ?? "",
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 20,
  },
];

/**
 * Loads paginated AI insights for the admin console.
 *
 * @param filters Reactive list filters.
 * @param providedClient Optional client override for tests.
 * @returns Vue Query result for AI insight summaries.
 */
export const useAdminInsightsQuery = (
  filters: MaybeRefOrGetter<AdminAIInsightsFilters>,
  providedClient?: AdminInsightsClient,
): UseQueryReturnType<AdminAIInsightsList, Error> => {
  const client = providedClient ?? useAdminInsightsClient();
  const normalizedFilters = computed(() => toValue(filters));

  return useQuery({
    queryKey: computed(() => adminInsightsListQueryKey(normalizedFilters.value)),
    queryFn: () => client.listInsights(normalizedFilters.value),
    staleTime: STALE_TIME.ACTIVE,
  });
};
