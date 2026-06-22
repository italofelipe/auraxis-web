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
 * Direction of a retrospective movement, as computed by the backend builder
 * (`insight_fluida_builder.py`). `pos` is a favourable movement (e.g. spending
 * less than the baseline), `neg` unfavourable, `neutral` flat.
 */
export type InsightRetroSign = "pos" | "neg" | "neutral";

/**
 * A retrospective comparison entry of the `general` dimension. Shape mirrors the
 * backend builder: `value` is a decimal currency amount and `sign` encodes
 * whether the movement is favourable.
 */
export interface InsightRetroEntryDTO {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly caption: string;
  readonly sign: InsightRetroSign;
}

/**
 * A per-theme numeric highlight tile. Shape mirrors the backend builder:
 * `value` is a decimal currency amount and `sub` is the supporting caption.
 */
export interface InsightHighlightDTO {
  readonly label: string;
  readonly value: number;
  readonly sub: string;
}

/**
 * Calculated outflow series: daily over the last 7 days, weekly over the last 6
 * weeks. Both windows end on (and include) the anchor; the backend emits values
 * only and the web derives the axis labels.
 */
export interface InsightSeriesDTO {
  readonly daily: readonly number[];
  readonly weekly: readonly number[];
}

/**
 * Additive **body** fields on the `/ai/insights` response that power the Fluida
 * reading (auraxis-api PR #1501/#1502). The backend builder
 * (`insight_fluida_builder.py`) computes ONLY the editorial body and numbers —
 * `paragraphs` / `retro` / `series` / `highlights`. It does NOT emit the
 * per-dimension editorial lead (severity / headline / opening / reading time /
 * next step); that always comes from the mock recorte, mirroring the mobile
 * mapper (`auraxis-app/features/insights/fluida/insight-to-fluida-vm.ts`).
 *
 * All optional: the legacy `items`/`content` payload is unchanged, and clients
 * that do not consume these fields keep working. When absent, the web falls back
 * to the Fluida mock behind `web.insights.fluida`.
 */
export interface InsightFluidaFieldsDTO {
  readonly paragraphs?: readonly string[];
  readonly retro?: readonly InsightRetroEntryDTO[];
  readonly highlights?: readonly InsightHighlightDTO[];
  readonly series?: InsightSeriesDTO;
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
