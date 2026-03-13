import type {
  DashboardPeriodDto,
  DashboardPeriodPreset,
  DashboardTimeseriesPointDto,
} from "~/features/dashboard/contracts/dashboard-overview.dto";

export type { DashboardPeriodPreset } from "~/features/dashboard/contracts/dashboard-overview.dto";

export type DashboardPeriod = DashboardPeriodDto;

export interface DashboardSummary {
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
  readonly upcomingDueTotal: number;
  readonly netWorth: number;
}

export interface DashboardComparison {
  readonly incomeVsPreviousMonthPercent: number | null;
  readonly expenseVsPreviousMonthPercent: number | null;
  readonly balanceVsPreviousMonthPercent: number | null;
}

export type DashboardTimeseriesPoint = DashboardTimeseriesPointDto;

export interface DashboardExpenseCategory {
  readonly category: string;
  readonly amount: number;
  readonly percentage: number;
}

export interface DashboardUpcomingDue {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly dueDate: string;
  readonly category: string | null;
}

export interface DashboardGoalSummary {
  readonly id: string;
  readonly name: string;
  readonly progressPercent: number;
  readonly currentAmount: number;
  readonly targetAmount: number;
  readonly targetDate: string | null;
}

export interface DashboardPortfolio {
  readonly currentValue: number;
  readonly changePercent: number | null;
}

export interface DashboardAlert {
  readonly type: string;
  readonly title: string;
  readonly description: string | null;
  readonly actionLabel: string | null;
}

export interface DashboardOverview {
  readonly period: DashboardPeriod;
  readonly summary: DashboardSummary;
  readonly comparison: DashboardComparison;
  readonly timeseries: DashboardTimeseriesPoint[];
  readonly expensesByCategory: DashboardExpenseCategory[];
  readonly upcomingDues: DashboardUpcomingDue[];
  readonly goals: DashboardGoalSummary[];
  readonly portfolio: DashboardPortfolio;
  readonly alerts: DashboardAlert[];
}

export interface DashboardOverviewFilters {
  readonly period: DashboardPeriodPreset;
  readonly start?: string;
  readonly end?: string;
}

export const DASHBOARD_PERIOD_OPTIONS: ReadonlyArray<{
  readonly value: DashboardPeriodPreset;
  readonly label: string;
}> = [
  { value: "current_month", label: "Mês atual" },
  { value: "1m", label: "1 mês" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
  { value: "custom", label: "Personalizado" },
];

export const DEFAULT_DASHBOARD_FILTERS: DashboardOverviewFilters = {
  period: "current_month",
};

/**
 * Creates an empty overview model for explicit empty states.
 *
 * @returns Empty dashboard overview model.
 */
export const createEmptyDashboardOverview = (): DashboardOverview => {
  return {
    period: {
      key: "current_month",
      start: "",
      end: "",
      label: "Mês atual",
    },
    summary: {
      income: 0,
      expense: 0,
      balance: 0,
      upcomingDueTotal: 0,
      netWorth: 0,
    },
    comparison: {
      incomeVsPreviousMonthPercent: null,
      expenseVsPreviousMonthPercent: null,
      balanceVsPreviousMonthPercent: null,
    },
    timeseries: [],
    expensesByCategory: [],
    upcomingDues: [],
    goals: [],
    portfolio: {
      currentValue: 0,
      changePercent: null,
    },
    alerts: [],
  };
};

/**
 * Checks whether the selected dashboard period requires explicit dates.
 *
 * @param period Selected period preset.
 * @returns Whether the period is custom.
 */
export const isCustomDashboardPeriod = (
  period: DashboardPeriodPreset,
): boolean => {
  return period === "custom";
};
