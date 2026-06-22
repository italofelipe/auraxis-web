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

/**
 * Severity vocabulary emitted by the Fluida editorial payload.
 * `ok | atencao | alerta` tag a section; `alta | media` tag individual alerts.
 */
export type InsightFluidaSeverity = "ok" | "atencao" | "alerta" | "alta" | "media";

/** A retrospective comparison entry ("ontem · anteontem · vs. semana"). */
export interface InsightRetroEntryDTO {
  readonly when: string;
  readonly value: number;
  readonly text: string;
}

/** A numeric highlight tile / pull-stat. */
export interface InsightHighlightDTO {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
}

/** An attention point with its own severity. */
export interface InsightAlertDTO {
  readonly severity: InsightFluidaSeverity;
  readonly text: string;
}

/** A bar series (7 days / 6 weeks) with its axis labels. */
export interface InsightSeriesDTO {
  readonly values: readonly number[];
  readonly labels: readonly string[];
}

/**
 * Additive fields on the `/ai/insights` response that power the Fluida reading
 * (auraxis-api PR #1502). All optional: the legacy `items`/`content` payload is
 * unchanged, and clients that do not consume these fields keep working. When
 * absent, the web falls back to the Fluida mock behind `web.insights.fluida`.
 */
export interface InsightFluidaFieldsDTO {
  readonly severity?: InsightFluidaSeverity;
  readonly read_min?: number;
  readonly paragraphs?: readonly string[];
  readonly retro?: readonly InsightRetroEntryDTO[];
  readonly highlights?: readonly InsightHighlightDTO[];
  readonly alerts?: readonly InsightAlertDTO[];
  readonly series?: InsightSeriesDTO;
  readonly next_step?: string;
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

export interface GenerateInsightResponseDTO extends InsightFluidaFieldsDTO {
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

export interface InsightChangeStatusDTO {
  readonly period_type: InsightPeriodType;
  readonly period_label: string;
  readonly changed: boolean;
  readonly current_context_hash: string;
  readonly last_context_hash: string | null;
  readonly last_generated_at: string | null;
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
