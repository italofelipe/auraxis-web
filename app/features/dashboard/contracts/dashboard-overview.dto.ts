export type DashboardPeriodPreset =
  | "current_month"
  | "1m"
  | "3m"
  | "6m"
  | "12m"
  | "custom";

export interface DashboardPeriodDto {
  readonly key: DashboardPeriodPreset;
  readonly start: string;
  readonly end: string;
  readonly label: string;
}

export interface DashboardSummaryDto {
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
  readonly upcoming_due_total: number;
  readonly net_worth: number;
}

export interface DashboardComparisonDto {
  readonly income_vs_previous_month_percent: number | null;
  readonly expense_vs_previous_month_percent: number | null;
  readonly balance_vs_previous_month_percent: number | null;
}

export interface DashboardTimeseriesPointDto {
  readonly date: string;
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
}

export interface DashboardExpenseCategoryDto {
  readonly category: string;
  readonly amount: number;
  readonly percentage: number;
}

export interface DashboardUpcomingDueDto {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly due_date: string;
  readonly category: string | null;
}

export interface DashboardGoalSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly progress_percent: number;
  readonly current_amount: number;
  readonly target_amount: number;
  readonly target_date: string | null;
}

export interface DashboardPortfolioDto {
  readonly current_value: number;
  readonly change_percent: number | null;
}

export interface DashboardAlertDto {
  readonly type: string;
  readonly title: string;
  readonly description: string | null;
  readonly action_label: string | null;
}

export interface DashboardOverviewDto {
  readonly period: DashboardPeriodDto;
  readonly summary: DashboardSummaryDto;
  readonly comparison: DashboardComparisonDto;
  readonly timeseries: DashboardTimeseriesPointDto[];
  readonly expenses_by_category: DashboardExpenseCategoryDto[];
  readonly upcoming_dues: DashboardUpcomingDueDto[];
  readonly goals: DashboardGoalSummaryDto[];
  readonly portfolio: DashboardPortfolioDto;
  readonly alerts: DashboardAlertDto[];
}

export interface DashboardTrendsMonthEntryDto {
  readonly month: string;
  readonly income: number;
  readonly expenses: number;
  readonly balance: number;
}

export interface DashboardTrendsResponseDto {
  readonly months: number;
  readonly series: DashboardTrendsMonthEntryDto[];
}
