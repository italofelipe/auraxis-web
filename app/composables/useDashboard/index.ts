/* v8 ignore start */
/**
 * Dashboard composable facade.
 *
 * Thin re-export of dashboard feature queries and models
 * for convenient access from pages and other composables.
 */
export { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";

export type {
  DashboardAlert,
  DashboardComparison,
  DashboardExpenseCategory,
  DashboardGoalSummary,
  DashboardOverview,
  DashboardOverviewFilters,
  DashboardPeriod,
  DashboardPeriodPreset,
  DashboardPortfolio,
  DashboardSummary,
  DashboardTimeseriesPoint,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

export {
  DASHBOARD_PERIOD_OPTIONS,
  DEFAULT_DASHBOARD_FILTERS,
  createEmptyDashboardOverview,
  isCustomDashboardPeriod,
} from "~/features/dashboard/model/dashboard-overview";
/* v8 ignore stop */
