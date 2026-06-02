/**
 * DTOs for the AI weekly-summary narrative endpoint (`GET /ai/insights/weekly-summary`).
 *
 * The endpoint is premium-gated (entitlement `advanced_simulations`) and wraps
 * its payload in the v2 envelope. Shapes mirror the Flask backend
 * (`ai_advisory_service.generate_weekly_summary_narrative`).
 */

export interface WeeklyPeriodTotalsDto {
  readonly start: string;
  readonly end: string;
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
  readonly transaction_count: number;
}

export interface WeeklyComparisonDto {
  readonly income_delta: number;
  readonly income_delta_percent: number;
  readonly expense_delta: number;
  readonly expense_delta_percent: number;
  readonly balance_delta: number;
  readonly balance_delta_percent: number;
}

export interface WeeklySummaryDto {
  readonly current_week: WeeklyPeriodTotalsDto;
  readonly previous_week: WeeklyPeriodTotalsDto;
  readonly comparison: WeeklyComparisonDto;
}

export interface WeeklySummaryNarrativeDto {
  readonly narrative: string;
  readonly tokens_used?: number;
  readonly cost_usd?: number;
  readonly model?: string;
  readonly summary: WeeklySummaryDto;
}
