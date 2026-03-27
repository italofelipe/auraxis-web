import type {
  DashboardExpenseCategory,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

export type DashboardTransactionTab = "dues" | "expenses";

export type DashboardTransactionsPanelProps = {
  upcomingDues: DashboardUpcomingDue[];
  expensesByCategory: DashboardExpenseCategory[];
  isLoading: boolean;
};
