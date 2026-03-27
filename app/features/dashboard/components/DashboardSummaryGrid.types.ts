import type {
  DashboardComparison,
  DashboardPortfolio,
  DashboardSummary,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

export type DashboardSummaryGridProps = {
  summary: DashboardSummary | null;
  comparison: DashboardComparison | null;
  portfolio: DashboardPortfolio | null;
  upcomingDues: DashboardUpcomingDue[];
  isLoading: boolean;
};
