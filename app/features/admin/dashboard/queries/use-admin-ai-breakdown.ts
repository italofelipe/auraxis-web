import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type { AdminAiBreakdown } from "~/features/admin/dashboard/model/admin-metrics";
import {
  type AdminAiBreakdownParams,
  type AdminMetricsClient,
  useAdminMetricsClient,
} from "~/features/admin/dashboard/services/admin-metrics.client";
import { ADMIN_METRICS_QUERY_KEY } from "./use-admin-metrics-overview";
import { ADMIN_METRICS_TIMESERIES_STALE_TIME_MS } from "./use-admin-metrics-timeseries";

/**
 * @param params Breakdown dimension and limit.
 * @returns Stable Vue Query key for the AI breakdown.
 */
export const adminAiBreakdownQueryKey = (params: AdminAiBreakdownParams): readonly unknown[] => [
  ...ADMIN_METRICS_QUERY_KEY,
  "ai",
  "breakdown",
  { by: params.by, limit: params.limit ?? 20 },
];

/**
 * Queries AI usage aggregated by model, endpoint or user.
 * Shares the heavy-aggregation staleTime with the timeseries (backend TTL 900 s).
 *
 * @param params Breakdown dimension and limit.
 * @param providedClient Optional client for tests.
 * @returns Vue Query state for the breakdown rows.
 */
export const useAdminAiBreakdownQuery = (
  params: AdminAiBreakdownParams,
  providedClient?: AdminMetricsClient,
): UseQueryReturnType<AdminAiBreakdown, Error> => {
  const client = providedClient ?? useAdminMetricsClient();

  return useQuery({
    queryKey: adminAiBreakdownQueryKey(params),
    queryFn: () => client.getAiBreakdown(params),
    staleTime: ADMIN_METRICS_TIMESERIES_STALE_TIME_MS,
  });
};
