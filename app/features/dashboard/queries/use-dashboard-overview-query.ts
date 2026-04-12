import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useDashboardOverviewApiClient,
  type DashboardOverviewApiClient,
} from "~/features/dashboard/services/dashboard-overview.client";
import {
  DEFAULT_DASHBOARD_FILTERS,
  isCustomDashboardPeriod,
  type DashboardOverview,
  type DashboardOverviewFilters,
} from "~/features/dashboard/model/dashboard-overview";

/**
 * Applies canonical defaults to the dashboard filters.
 *
 * @param filters Partial dashboard filters.
 * @returns Normalized dashboard filters.
 */
const normalizeFilters = (
  filters?: Partial<DashboardOverviewFilters>,
): DashboardOverviewFilters => {
  return {
    ...DEFAULT_DASHBOARD_FILTERS,
    ...filters,
  };
};

/**
 * Builds the Vue Query key for the dashboard overview request.
 *
 * @param filters Canonical dashboard filters.
 * @returns Stable query key.
 */
const createQueryKey = (
  filters: DashboardOverviewFilters,
): readonly ["dashboard", "overview", DashboardOverviewFilters] => {
  return ["dashboard", "overview", filters] as const;
};

/**
 * Decides whether the overview query can run safely.
 *
 * @param filters Canonical dashboard filters.
 * @returns Whether the query is executable.
 */
const canRunDashboardOverviewQuery = (filters: DashboardOverviewFilters): boolean => {
  if (!isCustomDashboardPeriod(filters.period)) {
    return true;
  }

  return Boolean(filters.start && filters.end);
};

/**
 * Resolves the canonical dashboard overview query.
 *
 * @param filters Optional dashboard filters.
 * @param providedClient Optional injected API client for tests or overrides.
 * @returns Vue Query state for the dashboard overview.
 */
export const useDashboardOverviewQuery = (
  filters?: MaybeRefOrGetter<Partial<DashboardOverviewFilters>>,
  providedClient?: DashboardOverviewApiClient,
): UseQueryReturnType<DashboardOverview, Error> => {
  const dashboardClient = providedClient ?? useDashboardOverviewApiClient();
  const resolvedFilters = computed(() => {
    return normalizeFilters(toValue(filters));
  });

  return useQuery({
    queryKey: computed(() => createQueryKey(resolvedFilters.value)),
    queryFn: () => dashboardClient.getOverview(resolvedFilters.value),
    enabled: computed(() => canRunDashboardOverviewQuery(resolvedFilters.value)),
    staleTime: STALE_TIME.STABLE,
  });
};
