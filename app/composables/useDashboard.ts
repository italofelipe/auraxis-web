import { useQuery } from "@tanstack/vue-query";

import type { DashboardOverview, MonthlyBalance } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";

const dashboardPlaceholder: DashboardOverview = {
  currentBalance: 22340,
  monthly: [
    { month: "2026-01", incomes: 12000, expenses: 8000, balance: 4000 },
    { month: "2026-02", incomes: 14300, expenses: 9960, balance: 4340 },
    { month: "2026-03", incomes: 11800, expenses: 7800, balance: 4000 },
  ],
};

const emptySnapshot: MonthlyBalance = {
  month: "1970-01",
  incomes: 0,
  expenses: 0,
  balance: 0,
};

interface HttpAdapter {
  get<TResponse>(url: string): Promise<{ data: TResponse }>;
}

export const createDashboardApi = (http: HttpAdapter) => {
  return {
    getOverview: async (): Promise<DashboardOverview> => {
      const response = await http.get<DashboardOverview>("/dashboard/overview");
      return response.data;
    },
  };
};

const getMonthSnapshot = (
  overview: DashboardOverview,
  month: string,
): MonthlyBalance => {
  const found = overview.monthly.find((item) => item.month === month);

  if (found) {
    return found;
  }

  return overview.monthly[0] ?? emptySnapshot;
};

export const useDashboardOverviewQuery = () => {
  const dashboardApi = createDashboardApi(useHttp());

  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async (): Promise<DashboardOverview> => {
      try {
        return await dashboardApi.getOverview();
      } catch {
        return dashboardPlaceholder;
      }
    },
  });
};

export const useDashboardMonthQuery = (month: () => string) => {
  const overviewQuery = useDashboardOverviewQuery();

  return useQuery({
    queryKey: ["dashboard", "month", month],
    queryFn: (): MonthlyBalance => {
      const monthValue = month();
      const overview = overviewQuery.data.value ?? dashboardPlaceholder;

      return getMonthSnapshot(overview, monthValue);
    },
  });
};
