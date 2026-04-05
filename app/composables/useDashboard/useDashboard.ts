export { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";
export { useDashboardTrendsQuery } from "~/features/dashboard/queries/use-dashboard-trends-query";

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
  DashboardTrends,
  DashboardTrendsMonthEntry,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";
export {
  DASHBOARD_PERIOD_OPTIONS,
  DEFAULT_DASHBOARD_FILTERS,
  createEmptyDashboardOverview,
  isCustomDashboardPeriod,
} from "~/features/dashboard/model/dashboard-overview";
