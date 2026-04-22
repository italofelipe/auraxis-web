import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useDashboardSurvivalIndexApiClient,
  type DashboardSurvivalIndexApiClient,
} from "~/features/dashboard/services/dashboard-survival-index.client";
import type { DashboardSurvivalIndex } from "~/features/dashboard/model/dashboard-survival-index";

const SURVIVAL_INDEX_QUERY_KEY = ["dashboard", "survival-index"] as const;

/**
 * Vue Query hook that exposes the dashboard survival-index metric.
 *
 * @param providedClient - Optional API client (useful for tests).
 * @returns UseQueryReturnType with the survival-index domain model.
 */
export const useDashboardSurvivalIndexQuery = (
  providedClient?: DashboardSurvivalIndexApiClient,
): UseQueryReturnType<DashboardSurvivalIndex, Error> => {
  const client = providedClient ?? useDashboardSurvivalIndexApiClient();

  return useQuery({
    queryKey: SURVIVAL_INDEX_QUERY_KEY,
    queryFn: () => client.getSurvivalIndex(),
    staleTime: STALE_TIME.STABLE,
    retry: false,
  });
};
