import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminMetricsOverview } from "~/features/admin/dashboard/model/admin-metrics";
import {
  type AdminMetricsClient,
  useAdminMetricsClient,
} from "~/features/admin/dashboard/services/admin-metrics.client";

/** Root cache key for admin product metrics. */
export const ADMIN_METRICS_QUERY_KEY = ["admin", "metrics"] as const;

/** @returns Stable Vue Query key for the metrics overview. */
export const adminMetricsOverviewQueryKey = (): readonly unknown[] => [
  ...ADMIN_METRICS_QUERY_KEY,
  "overview",
];

/**
 * Queries the aggregated product metrics that feed the four dashboard blocks.
 * `staleTime` mirrors the backend overview cache TTL (300 s) so the client
 * never re-fetches faster than the API can produce fresh numbers.
 *
 * @param providedClient Optional client for tests.
 * @returns Vue Query state for the overview.
 */
export const useAdminMetricsOverviewQuery = (
  providedClient?: AdminMetricsClient,
): UseQueryReturnType<AdminMetricsOverview, Error> => {
  const client = providedClient ?? useAdminMetricsClient();

  return useQuery({
    queryKey: adminMetricsOverviewQueryKey(),
    queryFn: () => client.getOverview(),
    staleTime: STALE_TIME.STABLE,
  });
};
