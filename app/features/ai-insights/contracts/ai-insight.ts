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
 * Editorial severity of a Fluida lead, as emitted by the backend heuristic
 * (auraxis-api #1503): `ok` (green), `attention` (amber) and `alert` (red).
 * Mirrors `AIInsightLeadType.severity` and the mobile `InsightSeverity`. The
 * Fluida mapper translates it onto the web's `FluidaSeverity` vocabulary.
 */
export type InsightLeadSeverity = "ok" | "attention" | "alert";

/**
 * Additive editorial **lead** (masthead) of a Fluida insight (auraxis-api #1503
 * / #1508). `severity` is a deterministic heuristic over the calculated
 * retro/highlights; `read_min` is fixed by cadence; `title` / `lead` /
 * `next_step` are derived from the AI `summary` (no extra LLM call).
 *
 * Field names are **snake_case** because this is the REST `/ai/insights/generate`
 * wire shape (`build_lead` in `insight_lead_builder.py`), matching the sibling
 * Fluida fields (`paragraphs` / `retro` / `series` / `highlights`) and the rest
 * of the REST contract (`period_label`, `tokens_used`, …). The GraphQL
 * `AIInsightLeadType` exposes the same data camelCased, but the web consumes the
 * REST endpoint, so the camelCase generated type is not the runtime shape here.
 *
 * When present, the Fluida reading takes its lead (severity / headline / opening
 * / reading time / next step) from here instead of the mock recorte; when
 * absent, the mapper falls back to the mock lead — same fallback semantics the
 * mobile mapper applies to the body.
 */
export interface InsightLeadDTO {
  readonly severity: InsightLeadSeverity;
  readonly read_min: number;
  readonly title: string;
  /** Opening paragraph of the reading (becomes the VM `summary`). */
  readonly lead: string;
  readonly next_step: string;
}

/**
 * Additive Fluida fields on the `/ai/insights` response that power the editorial
 * reading. The body + numbers (`paragraphs` / `retro` / `series` / `highlights`)
 * land in auraxis-api PR #1501/#1502; the editorial **lead** (`lead`) is the
 * later additive contract (#1503/#1508). When the lead is present the reading
 * takes its severity / headline / opening / reading time / next step from the
 * backend; when absent it falls back to the mock recorte — the same fallback the
 * mobile mapper applies to the body
 * (`auraxis-app/features/insights/fluida/insight-to-fluida-vm.ts`).
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
  readonly lead?: InsightLeadDTO;
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
