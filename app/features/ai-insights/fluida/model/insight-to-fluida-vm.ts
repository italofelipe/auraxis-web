/**
 * Pure mapper: real `/ai/insights` payload → {@link FluidaInsightSource} VM.
 *
 * The backend (auraxis-api PR #1501/#1502) enriches a single generated insight
 * with the structured Fluida fields (`paragraphs` / `retro` / `series` /
 * `highlights`) for ONE period (daily OR weekly) and ONE dimension. The Fluida
 * screen, however, renders a full source object covering both cadences and every
 * theme. This mapper therefore OVERLAYS the real fields onto the Fluida mock
 * skeleton at the node addressed by `{ dimension, cadence }`, keeping the screen
 * full while the remaining slots fall back to mock content.
 *
 * Fallback rule: when the DTO carries none of the structured fields (backend not
 * deployed, or a legacy payload), the mock source is returned verbatim so the
 * screen is never empty.
 *
 * This module is framework-free (no Vue, no I/O) and is unit-tested first.
 */

import type {
  InsightDimension,
  InsightFluidaFieldsDTO,
  InsightHighlightDTO,
  InsightRetroEntryDTO,
} from "~/features/ai-insights/contracts/ai-insight";

import { FLUIDA_MOCK_SOURCE } from "./insight-fluida-mock";
import {
  formatFluidaCurrency,
  type FluidaCadence,
  type FluidaInsightSource,
  type FluidaNode,
  type FluidaRetroEntry,
  type FluidaSeriesData,
  type FluidaStat,
  type FluidaThemeId,
  type FluidaThemeSource,
} from "./insight-fluida";

/** The dimension + cadence the screen is currently reading. */
export interface FluidaMapContext {
  readonly dimension: InsightDimension;
  readonly cadence: FluidaCadence;
}

/** Theme dimensions that have a dedicated Fluida tab (i.e. not `general`/`wallet`). */
type FluidaThemeDimension = Exclude<FluidaThemeId, "general">;

const FLUIDA_THEME_DIMENSIONS: ReadonlySet<FluidaThemeDimension> = new Set<FluidaThemeDimension>([
  "transactions",
  "goals",
  "budgets",
  "credit_cards",
]);

const DAILY_AXIS_LENGTH = 7;
const WEEKLY_AXIS_LENGTH = 6;

/**
 * Reports whether a DTO carries any of the structured Fluida fields. Empty
 * arrays/series count as "no data" so an enriched-but-empty payload still falls
 * back to the mock instead of blanking the screen.
 *
 * @param dto Candidate insight payload (may be undefined).
 * @returns True when at least one structured field has data.
 */
export const hasFluidaPayload = (dto: InsightFluidaFieldsDTO | undefined): boolean => {
  if (!dto) {
    return false;
  }
  const hasParagraphs = Array.isArray(dto.paragraphs) && dto.paragraphs.length > 0;
  const hasRetro = Array.isArray(dto.retro) && dto.retro.length > 0;
  const hasHighlights = Array.isArray(dto.highlights) && dto.highlights.length > 0;
  const hasSeries =
    dto.series !== undefined &&
    ((Array.isArray(dto.series.daily) && dto.series.daily.length > 0) ||
      (Array.isArray(dto.series.weekly) && dto.series.weekly.length > 0));

  return hasParagraphs || hasRetro || hasHighlights || hasSeries;
};

/**
 * Builds the daily axis labels (calendar day-of-month) for a 7-day window ending
 * today. Backend series omit labels; the Fluida chart needs them.
 *
 * @param length Number of bars in the daily series.
 * @param today Reference "today" (overridable for tests).
 * @returns Day-of-month labels, oldest first.
 */
const buildDailyLabels = (length: number, today: Date): string[] => {
  const labels: string[] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    labels.push(String(day.getDate()));
  }
  return labels;
};

/**
 * Builds the weekly axis labels for a 6-week window. The last bucket is the
 * current week ("Atual"); earlier buckets are relative ("S-1" … "S-5").
 *
 * @param length Number of bars in the weekly series.
 * @returns Relative week labels, oldest first.
 */
const buildWeeklyLabels = (length: number): string[] => {
  const labels: string[] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    labels.push(offset === 0 ? "Atual" : `S-${offset}`);
  }
  return labels;
};

/**
 * Builds a Fluida series node (values + derived labels) for a single cadence.
 *
 * @param values Raw outflow values from the backend.
 * @param cadence Series cadence.
 * @param today Reference "today" used to build daily labels.
 * @returns Chart-ready series data.
 */
const toSeriesData = (
  values: readonly number[],
  cadence: FluidaCadence,
  today: Date,
): FluidaSeriesData => ({
  values: [...values],
  labels:
    cadence === "daily"
      ? buildDailyLabels(values.length || DAILY_AXIS_LENGTH, today)
      : buildWeeklyLabels(values.length || WEEKLY_AXIS_LENGTH),
});

/**
 * Maps a backend retro entry into a Fluida retro entry. `label` becomes the
 * "when" line and `caption` the supporting text; the sign is carried implicitly
 * by the (signed) value the view formatter already handles.
 *
 * @param entry Backend retro entry.
 * @returns Fluida retro entry.
 */
const toRetroEntry = (entry: InsightRetroEntryDTO): FluidaRetroEntry => ({
  when: entry.label,
  value: entry.value,
  text: entry.caption,
});

/**
 * Maps a backend highlight into a Fluida stat tile, formatting the numeric value
 * as pt-BR BRL (the tile renders a pre-formatted string).
 *
 * @param highlight Backend highlight.
 * @returns Fluida stat tile.
 */
const toHighlightStat = (highlight: InsightHighlightDTO): FluidaStat => ({
  label: highlight.label,
  value: formatFluidaCurrency(highlight.value),
  caption: highlight.sub,
});

/**
 * Overlays the DTO's scalar/prose fields (paragraphs, severity, reading time,
 * next step) onto a base node. Empty prose is ignored so the mock copy survives.
 *
 * @param base Mock node to overlay onto.
 * @param dto Real payload.
 * @returns A new node with the real fields applied.
 */
const overlayCommon = (base: FluidaNode, dto: InsightFluidaFieldsDTO): FluidaNode => {
  const paragraphs =
    Array.isArray(dto.paragraphs) && dto.paragraphs.length > 0
      ? [...dto.paragraphs]
      : base.paragraphs;

  return {
    ...base,
    paragraphs,
    ...(dto.severity ? { severity: dto.severity } : {}),
    ...(typeof dto.read_min === "number" && Number.isFinite(dto.read_min)
      ? { readMin: dto.read_min }
      : {}),
    ...(typeof dto.next_step === "string" && dto.next_step.length > 0
      ? { nextStep: dto.next_step }
      : {}),
  };
};

/**
 * Overlays the `general`-dimension extras (retro cards) onto a node.
 *
 * @param node Node already carrying the common overlay.
 * @param dto Real payload.
 * @returns Node with mapped retro entries when present.
 */
const overlayGeneral = (node: FluidaNode, dto: InsightFluidaFieldsDTO): FluidaNode =>
  Array.isArray(dto.retro) && dto.retro.length > 0
    ? { ...node, retro: dto.retro.map(toRetroEntry) }
    : node;

/**
 * Overlays the per-theme extras (highlight tiles) onto a node.
 *
 * @param node Node already carrying the common overlay.
 * @param dto Real payload.
 * @returns Node with mapped highlight tiles when present.
 */
const overlayTheme = (node: FluidaNode, dto: InsightFluidaFieldsDTO): FluidaNode =>
  Array.isArray(dto.highlights) && dto.highlights.length > 0
    ? { ...node, highlights: dto.highlights.map(toHighlightStat) }
    : node;

/**
 * Resolves the Fluida theme dimension addressed by the context, collapsing the
 * `wallet` dimension (no Fluida tab) and `general` to "none" so the prose lands
 * on the general reading instead.
 *
 * @param dimension Backend insight dimension.
 * @returns The matching Fluida theme dimension, or null for general/wallet.
 */
const resolveThemeDimension = (
  dimension: InsightDimension,
): FluidaThemeDimension | null =>
  FLUIDA_THEME_DIMENSIONS.has(dimension as FluidaThemeDimension)
    ? (dimension as FluidaThemeDimension)
    : null;

/**
 * Maps a real (enriched) insight payload into a {@link FluidaInsightSource},
 * overlaying it onto the mock skeleton at the addressed node.
 *
 * When the payload carries no structured fields, the mock source is returned
 * unchanged (full fallback — the screen is never empty).
 *
 * @param dto Insight payload with the additive Fluida fields (may be undefined).
 * @param context Dimension + cadence the screen is reading.
 * @param today Reference "today" used to derive daily axis labels (tests).
 * @returns A Fluida source ready for `deriveFluidaView`.
 */
export const insightToFluidaVM = (
  dto: InsightFluidaFieldsDTO | undefined,
  context: FluidaMapContext,
  today: Date = new Date(),
): FluidaInsightSource => {
  if (!hasFluidaPayload(dto)) {
    return FLUIDA_MOCK_SOURCE;
  }

  const payload = dto as InsightFluidaFieldsDTO;
  const { cadence } = context;
  const themeDimension = resolveThemeDimension(context.dimension);

  // Series always carries both cadences from the backend; overlay whichever is
  // present, keeping the mock for any cadence the payload omits.
  const series: FluidaInsightSource["series"] = {
    daily:
      payload.series && payload.series.daily.length > 0
        ? toSeriesData(payload.series.daily, "daily", today)
        : FLUIDA_MOCK_SOURCE.series.daily,
    weekly:
      payload.series && payload.series.weekly.length > 0
        ? toSeriesData(payload.series.weekly, "weekly", today)
        : FLUIDA_MOCK_SOURCE.series.weekly,
  };

  if (themeDimension === null) {
    // General (or wallet → general): overlay the general node for this cadence.
    const baseNode = FLUIDA_MOCK_SOURCE.general[cadence];
    const overlaid = overlayGeneral(overlayCommon(baseNode, payload), payload);
    return {
      ...FLUIDA_MOCK_SOURCE,
      series,
      general: { ...FLUIDA_MOCK_SOURCE.general, [cadence]: overlaid },
    };
  }

  // Theme reading: overlay the theme node for this cadence, preserving the
  // theme's presentation metadata (label/color) and its other cadence node.
  const baseTheme: FluidaThemeSource =
    FLUIDA_MOCK_SOURCE.themes[themeDimension] ?? FLUIDA_MOCK_SOURCE.themes.transactions!;
  const overlaidNode = overlayTheme(overlayCommon(baseTheme[cadence], payload), payload);

  return {
    ...FLUIDA_MOCK_SOURCE,
    series,
    themes: {
      ...FLUIDA_MOCK_SOURCE.themes,
      [themeDimension]: { ...baseTheme, [cadence]: overlaidNode },
    },
  };
};
