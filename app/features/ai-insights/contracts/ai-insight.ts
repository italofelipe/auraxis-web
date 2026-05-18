export type InsightType = "daily" | "weekly" | "monthly" | "recap";
export type InsightPeriodType = "daily" | "weekly" | "monthly";
export type InsightDimension = "general" | "transactions" | "credit_cards" | "goals" | "budgets";

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
}

export interface GenerateInsightResponseDTO {
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
}

export interface GenerateInsightResponseWithMetaDTO extends GenerateInsightResponseDTO {
  readonly callsRemaining: number | null;
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
