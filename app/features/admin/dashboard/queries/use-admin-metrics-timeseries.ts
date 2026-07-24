import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type {
  AdminMetricsBlock,
  AdminMetricsTimeseries,
} from "~/features/admin/dashboard/model/admin-metrics";
import {
  type AdminMetricsClient,
  type AdminMetricsTimeseriesParams,
  useAdminMetricsClient,
} from "~/features/admin/dashboard/services/admin-metrics.client";
import { ADMIN_METRICS_QUERY_KEY } from "./use-admin-metrics-overview";

/**
 * Backend timeseries responses are cached for 900 s; matching it here keeps
 * chart refetches aligned with the freshest data the API can actually serve.
 */
export const ADMIN_METRICS_TIMESERIES_STALE_TIME_MS = 900 * 1000;

/**
 * @param block Metric block.
 * @param params Window and interval filters.
 * @returns Stable Vue Query key for one block timeseries.
 */
export const adminMetricsTimeseriesQueryKey = (
  block: AdminMetricsBlock,
  params: AdminMetricsTimeseriesParams,
): readonly unknown[] => [
  ...ADMIN_METRICS_QUERY_KEY,
  "timeseries",
  block,
  { from: params.from, to: params.to, interval: params.interval },
];

/**
 * Queries one metric block timeseries for the dashboard charts.
 *
 * @param block Metric block to chart.
 * @param params Reactive window and interval filters.
 * @param providedClient Optional client for tests.
 * @returns Vue Query state for the block series.
 */
export const useAdminMetricsTimeseriesQuery = (
  block: AdminMetricsBlock,
  params: MaybeRefOrGetter<AdminMetricsTimeseriesParams>,
  providedClient?: AdminMetricsClient,
): UseQueryReturnType<AdminMetricsTimeseries, Error> => {
  const client = providedClient ?? useAdminMetricsClient();
  const normalizedParams = computed(() => toValue(params));

  return useQuery({
    queryKey: computed(() => adminMetricsTimeseriesQueryKey(block, normalizedParams.value)),
    queryFn: () => client.getTimeseries(block, normalizedParams.value),
    staleTime: ADMIN_METRICS_TIMESERIES_STALE_TIME_MS,
  });
};
