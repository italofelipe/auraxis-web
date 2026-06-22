/**
 * Pure mapper: real `/ai/insights` payload → {@link FluidaInsightSource} VM.
 *
 * The backend (auraxis-api PR #1501/#1502) enriches a single generated insight
 * with the structured Fluida **body** fields (`paragraphs` / `retro` / `series`
 * / `highlights`) for ONE period (daily OR weekly) and ONE dimension, and — once
 * #1503/#1508 ships — the editorial **lead** (`lead`: severity / headline /
 * opening / reading time / next step). The Fluida screen, however, renders a
 * full source object covering both cadences and every theme. This mapper
 * therefore OVERLAYS the real body AND the real lead onto the Fluida mock
 * skeleton at the node addressed by `{ dimension, cadence }`, keeping the screen
 * full while the remaining slots fall back to mock content.
 *
 * Lead fallback (parity with the mobile mapper
 * `auraxis-app/features/insights/fluida/insight-to-fluida-vm.ts`, which uses the
 * real value when present and the mock otherwise): when the payload carries a
 * `lead`, the reading's severity/headline/opening/reading time/next step come
 * from the backend; when it is absent, they stay on the mock recorte.
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
  InsightLeadDTO,
  InsightLeadSeverity,
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
  type FluidaSeverity,
  type FluidaStat,
  type FluidaThemeId,
  type FluidaThemeSource,
} from "./insight-fluida";

/**
 * Translates the backend lead severity vocabulary (`ok` | `attention` | `alert`,
 * mirroring `AIInsightLeadType.severity` and the mobile `InsightSeverity`) onto
 * the web's `FluidaSeverity` vocabulary that drives the chip presentation.
 */
const LEAD_SEVERITY_TO_FLUIDA: Record<InsightLeadSeverity, FluidaSeverity> = {
  ok: "ok",
  attention: "atencao",
  alert: "alerta",
};

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
 * Reports whether an array field actually carries entries (guards against
 * `undefined` and empty arrays uniformly).
 *
 * @param value Candidate array field.
 * @returns True when the value is a non-empty array.
 */
const hasItems = (value: readonly unknown[] | undefined): boolean =>
  Array.isArray(value) && value.length > 0;

/**
 * Reports whether a series object carries at least one cadence with data.
 *
 * @param series Candidate series field.
 * @returns True when the daily or weekly array has entries.
 */
const hasSeriesData = (series: InsightFluidaFieldsDTO["series"]): boolean =>
  series !== undefined && (hasItems(series.daily) || hasItems(series.weekly));

/**
 * Reports whether a DTO carries any of the structured Fluida fields — body,
 * numbers OR the editorial lead. Empty arrays/series count as "no data" so an
 * enriched-but-empty payload still falls back to the mock instead of blanking
 * the screen; a lead alone is enough to treat the payload as real.
 *
 * @param dto Candidate insight payload (may be undefined).
 * @returns True when at least one structured field has data.
 */
export const hasFluidaPayload = (dto: InsightFluidaFieldsDTO | undefined): boolean => {
  if (!dto) {
    return false;
  }

  return (
    hasItems(dto.paragraphs) ||
    hasItems(dto.retro) ||
    hasItems(dto.highlights) ||
    hasSeriesData(dto.series) ||
    (dto.lead !== undefined && dto.lead !== null)
  );
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
 * Overlays the DTO's editorial **lead** (severity, headline, opening summary,
 * reading time, next step) onto a base node when the backend supplies it
 * (additive #1503/#1508). The backend `lead.lead` is the opening paragraph and
 * becomes the node `summary`; `lead.severity` is mapped onto the Fluida
 * vocabulary. When no `lead` is present the mock recorte survives verbatim —
 * the same fallback the mobile mapper applies to the body.
 *
 * @param base Node already carrying the body overlay (and the mock lead).
 * @param dto Real payload.
 * @returns A node with the real lead applied, or the base node unchanged.
 */
const overlayLead = (base: FluidaNode, dto: InsightFluidaFieldsDTO): FluidaNode => {
  const lead: InsightLeadDTO | undefined | null = dto.lead;
  if (!lead) {
    return base;
  }

  return {
    ...base,
    severity: LEAD_SEVERITY_TO_FLUIDA[lead.severity] ?? base.severity,
    readMin: lead.read_min,
    title: lead.title,
    summary: lead.lead,
    nextStep: lead.next_step,
  };
};

/**
 * Overlays the DTO's **body** prose (`paragraphs`) and editorial **lead** onto a
 * base node. The body and the lead are each absence-safe: empty prose keeps the
 * mock paragraphs, and a missing `lead` keeps the mock recorte's lead — mirroring
 * the mobile mapper (`auraxis-app/features/insights/fluida/insight-to-fluida-vm.ts`),
 * where the real reading uses the backend value when present and the mock
 * otherwise.
 *
 * @param base Mock node supplying the fallback lead/prose.
 * @param dto Real payload.
 * @returns A new node with the real prose and lead applied over the mock.
 */
const overlayCommon = (base: FluidaNode, dto: InsightFluidaFieldsDTO): FluidaNode => {
  const paragraphs =
    Array.isArray(dto.paragraphs) && dto.paragraphs.length > 0
      ? [...dto.paragraphs]
      : base.paragraphs;

  return overlayLead({ ...base, paragraphs }, dto);
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
