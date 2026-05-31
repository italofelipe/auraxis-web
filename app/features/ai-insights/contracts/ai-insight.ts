export type InsightType = "daily" | "weekly" | "monthly" | "recap";
export type InsightPeriodType = "daily" | "weekly" | "monthly";
export type InsightDimension = "general" | "transactions" | "credit_cards" | "goals" | "budgets" | "wallet";
export type InsightSourceSurface =
  | "dashboard"
  | "insights"
  | "transactions"
  | "credit_cards"
  | "goals"
  | "budgets"
  | "wallet";

export interface InsightItem {
  readonly type: string;
  readonly dimension?: InsightDimension;
  readonly title: string;
  readonly message: string;
  readonly evidence?: readonly string[];
}

export interface AIInsightDTO {
  readonly id: string;
  readonly content: string;
  readonly items?: InsightItem[];
  readonly insight_type: InsightType;
  readonly period_type?: InsightPeriodType;
  readonly period_label: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly model: string;
  readonly tokens_used: number;
  readonly cost_usd: number;
  readonly created_at: string;
}

export interface GenerateInsightRequestDTO {
  readonly period_type: InsightPeriodType;
  readonly anchor_date?: string;
  readonly source_surface?: InsightSourceSurface;
  readonly timezone?: string;
}

export interface GenerateInsightResponseDTO {
  readonly id?: string;
  readonly summary: string;
  readonly items: InsightItem[];
  readonly period_type: InsightPeriodType;
  readonly period_label: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly context_version?: string;
  readonly context_hash?: string;
  readonly tokens_used: number;
  readonly cost_usd: number;
  readonly model: string;
  readonly cached: boolean;
  readonly forecast?: boolean;
}

export interface GenerateInsightResponseWithMetaDTO extends GenerateInsightResponseDTO {
  readonly callsRemaining: number | null;
  readonly callsRemainingMonth: number | null;
}

export interface SubmitInsightFeedbackRequestDTO {
  readonly relevance: number;
  readonly truthfulness: number;
  readonly depth: number;
  readonly usefulness: number;
  readonly comment?: string;
}

export interface InsightFeedbackDTO {
  readonly id: string;
  readonly insight_id: string;
  readonly relevance: number;
  readonly truthfulness: number;
  readonly depth: number;
  readonly usefulness: number;
  readonly comment: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AIInsightHistoryDTO {
  readonly items: AIInsightDTO[];
  readonly page: number;
  readonly per_page: number;
  readonly total: number;
}

export interface V2EnvelopeDTO<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: T;
}
