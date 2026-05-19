import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminAIInsightDetail } from "~/features/admin/insights/model/admin-insight";
import {
  type AdminInsightsClient,
  useAdminInsightsClient,
} from "~/features/admin/insights/services/admin-insights.client";

/**
 * Builds a stable query key for one admin AI insight detail.
 *
 * @param insightId Selected insight identifier.
 * @returns Stable Vue Query key.
 */
export const adminInsightDetailQueryKey = (
  insightId: string | null | undefined,
): readonly unknown[] => ["admin", "ai-insights", "detail", insightId ?? ""];

/**
 * Loads one AI insight detail for the admin console.
 *
 * @param insightId Reactive selected insight identifier.
 * @param providedClient Optional client override for tests.
 * @returns Vue Query result for the selected insight.
 */
export const useAdminInsightQuery = (
  insightId: MaybeRefOrGetter<string | null | undefined>,
  providedClient?: AdminInsightsClient,
): UseQueryReturnType<AdminAIInsightDetail, Error> => {
  const client = providedClient ?? useAdminInsightsClient();
  const selectedInsightId = computed(() => toValue(insightId));

  return useQuery({
    queryKey: computed(() => adminInsightDetailQueryKey(selectedInsightId.value)),
    queryFn: () => client.getInsight(selectedInsightId.value ?? ""),
    enabled: computed(() => Boolean(selectedInsightId.value)),
    staleTime: STALE_TIME.ACTIVE,
  });
};
