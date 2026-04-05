import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useDashboardTrendsApiClient,
  type DashboardTrendsApiClient,
} from "~/features/dashboard/services/dashboard-trends.client";
import type { DashboardTrends } from "~/features/dashboard/model/dashboard-overview";

/**
 * Builds the Vue Query key for the dashboard trends request.
 *
 * @param months Number of months in the trends window.
 * @returns Stable query key.
 */
const createTrendsQueryKey = (
  months: number,
): readonly ["dashboard", "trends", number] => {
  return ["dashboard", "trends", months] as const;
};

/**
 * Resolves the canonical dashboard trends query.
 *
 * Fetches multi-month income vs expense series from `GET /dashboard/trends?months=N`.
 * Stale time is 5 minutes to match the API cache TTL.
 *
 * @param months Number of months to fetch (default 6). Accepts a plain number or a Ref<number>.
 * @param providedClient Optional injected API client for tests or overrides.
 * @returns Vue Query state for the dashboard trends.
 */
export const useDashboardTrendsQuery = (
  months: MaybeRefOrGetter<number> = 6,
  providedClient?: DashboardTrendsApiClient,
): UseQueryReturnType<DashboardTrends, Error> => {
  const trendsClient = providedClient ?? useDashboardTrendsApiClient();
  const resolvedMonths = computed(() => toValue(months));

  return useQuery({
    queryKey: computed(() => createTrendsQueryKey(resolvedMonths.value)),
    queryFn: () => trendsClient.getTrends(resolvedMonths.value),
    staleTime: 5 * 60_000,
  });
};
