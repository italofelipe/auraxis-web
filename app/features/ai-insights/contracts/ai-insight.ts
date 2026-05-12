export type InsightType = "daily" | "weekly" | "monthly" | "recap";

export interface InsightItem {
  readonly type: string;
  readonly title: string;
  readonly message: string;
}

export interface AIInsightDTO {
  readonly id: string;
  readonly content: string;
  readonly insight_type: InsightType;
  readonly period_label: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly model: string;
  readonly tokens_used: number;
  readonly cost_usd: number;
  readonly created_at: string;
}

export interface GenerateInsightResponseDTO {
  readonly insights: string;
  readonly tokens_used: number;
  readonly cost_usd: number;
  readonly month: string;
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
