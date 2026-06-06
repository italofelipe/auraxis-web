/**
 * DTOs for the spending-patterns radar (PROD-04, #568).
 *
 * The web POSTs the user's recent expense transactions to
 * `POST /ai/insights/spending-patterns` (v1 gateway → auraxis-api-v2) and
 * receives up to three detected compulsive-spending patterns.
 */

export type SpendingPatternSeverityDto = "low" | "medium" | "high";

export interface SpendingPatternTransactionInputDto {
  readonly amount: number;
  readonly occurred_on: string;
  readonly category?: string;
  readonly merchant?: string;
  readonly kind: "expense" | "income";
}

export interface SpendingPatternsRequestDto {
  readonly transactions: readonly SpendingPatternTransactionInputDto[];
  readonly period_days: number;
}

export interface SpendingPatternDto {
  readonly description: string;
  readonly frequency: string;
  readonly average_value: number;
  readonly suggested_action: string;
  readonly severity: SpendingPatternSeverityDto;
}

export interface SpendingPatternsResponseDto {
  readonly patterns: readonly SpendingPatternDto[];
  readonly model: string;
  readonly generated_count: number;
}

/**
 * Read-only cached radar payload from `GET /ai/insights/spending-patterns/latest`.
 *
 * The analysis is produced by a scheduled cron and persisted server-side; the
 * dashboard reads it without calling the LLM or consuming the AI daily quota.
 * `generated_at` is `null` when the cron has not produced an analysis yet.
 */
export interface SpendingPatternsLatestResponseDto {
  readonly patterns: readonly SpendingPatternDto[];
  readonly generated_at: string | null;
  readonly period_label: string | null;
  readonly model: string;
  readonly cost_usd: number;
  readonly tokens_used: number;
}
