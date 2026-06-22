/**
 * Domain model + pure derivation logic for the "Fluida" editorial reading of the
 * AI Insights screen.
 *
 * This module is intentionally framework-free (no Vue, no Pinia, no I/O). It maps
 * a backend-shaped source object (see {@link FluidaInsightSource}, mirrored by the
 * mobile `InsightFluidaVM`) into the view model consumed by the Fluida components.
 *
 * The source shape is aligned with the additive `/ai/insights` fields
 * (`paragraphs` / `retro` / `series` / `highlights`) introduced by the backend.
 * Until that endpoint ships, a mock implementing this exact shape feeds the view.
 */

/** Reading cadence selected in the masthead toggle. */
export type FluidaCadence = "daily" | "weekly";

/** Severity vocabulary used by both section badges and per-alert chips. */
export type FluidaSeverity = "ok" | "atencao" | "alerta" | "alta" | "media";

/** Logical theme tab id. `general` is the cross-cutting reading. */
export type FluidaThemeId = "general" | "transactions" | "goals" | "budgets" | "credit_cards";

/** Naive-aligned tone used to colour chips and accents. */
export type FluidaTone = "success" | "warning" | "danger" | "neutral";

/** A single comparison entry ("ontem · anteontem · vs. semana"). */
export interface FluidaRetroEntry {
  readonly when: string;
  readonly value: number;
  readonly text: string;
}

/** A single attention point rendered in the alert list. */
export interface FluidaAlertEntry {
  readonly severity: FluidaSeverity;
  readonly text: string;
}

/** A numeric highlight tile / pull-stat. */
export interface FluidaStat {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
}

/** Per-cadence content node shared by the general reading and each theme. */
export interface FluidaNode {
  readonly severity: FluidaSeverity;
  readonly readMin?: number;
  readonly title: string;
  readonly summary: string;
  readonly paragraphs: readonly string[];
  readonly nextStep: string;
  /** Comparison cards — only present on the general reading. */
  readonly retro?: readonly FluidaRetroEntry[];
  /** Attention points — only present on the general reading. */
  readonly alerts?: readonly FluidaAlertEntry[];
  /** Numeric tiles — only present on theme readings. */
  readonly highlights?: readonly FluidaStat[];
  /** Optional editorial pull-stat highlighted next to a paragraph. */
  readonly pullStat?: FluidaStat;
}

/** A bar series (7 days or 6 weeks) with its axis labels. */
export interface FluidaSeriesData {
  readonly values: readonly number[];
  readonly labels: readonly string[];
}

/** Provenance footer metadata. */
export interface FluidaMeta {
  readonly model: string;
  readonly generatedAt: string;
  readonly referenceLabel: string;
  readonly privacyNote: string;
}

/** A theme reading: presentation metadata + its two cadence nodes. */
export interface FluidaThemeSource {
  readonly label: string;
  readonly color: string;
  readonly daily: FluidaNode;
  readonly weekly: FluidaNode;
}

/** The full source object mapped into the view model. */
export interface FluidaInsightSource {
  readonly meta: FluidaMeta;
  readonly series: { readonly daily: FluidaSeriesData; readonly weekly: FluidaSeriesData };
  readonly general: { readonly daily: FluidaNode; readonly weekly: FluidaNode };
  readonly themes: Partial<Record<Exclude<FluidaThemeId, "general">, FluidaThemeSource>>;
}

/** Resolved severity presentation (chip label, tone, CSS colour token). */
export interface FluidaSeverityPresentation {
  readonly tone: FluidaTone;
  readonly label: string;
  readonly colorVar: string;
}

/** Resolved theme tab presentation. */
export interface FluidaThemeMeta {
  readonly id: FluidaThemeId;
  readonly label: string;
  readonly colorVar: string;
  readonly isGeneral: boolean;
}

/** A chart-ready series with peak detection. */
export interface FluidaChart {
  readonly values: readonly number[];
  readonly labels: readonly string[];
  readonly peakIndex: number;
  readonly peakValue: number;
}

/** A render-ready comparison card. */
export interface FluidaCompareCard {
  readonly when: string;
  readonly amountLabel: string;
  readonly isNegative: boolean;
  readonly text: string;
}

/** A render-ready attention point. */
export interface FluidaAlertCard {
  readonly text: string;
  readonly severity: FluidaSeverityPresentation;
}

/** Lead (editorial header) view model. */
export interface FluidaLeadView {
  readonly kicker: string;
  readonly accentColor: string;
  readonly severity: FluidaSeverityPresentation;
  readonly readMinutes: number;
  readonly title: string;
  readonly summary: string;
}

/** Full derived view model for one (cadence, theme) selection. */
export interface FluidaView {
  readonly cadence: FluidaCadence;
  readonly themeId: FluidaThemeId;
  readonly isGeneral: boolean;
  readonly lead: FluidaLeadView;
  readonly paragraphs: readonly string[];
  readonly chart: FluidaChart;
  readonly nextStep: string;
  readonly meta: FluidaMeta;
  readonly compare?: readonly FluidaCompareCard[];
  readonly alerts?: readonly FluidaAlertCard[];
  readonly highlights?: readonly FluidaStat[];
  readonly pullStat?: FluidaStat;
}

/** Selection driving {@link deriveFluidaView}. */
export interface FluidaSelection {
  readonly cadence: FluidaCadence;
  readonly theme: FluidaThemeId;
}

/** Stable tab order; `general` always leads. */
export const FLUIDA_THEME_ORDER: readonly FluidaThemeId[] = [
  "general",
  "transactions",
  "goals",
  "budgets",
  "credit_cards",
];

const SEVERITY_PRESENTATION: Record<FluidaSeverity, FluidaSeverityPresentation> = {
  ok: { tone: "success", label: "Tudo certo", colorVar: "var(--color-positive)" },
  atencao: { tone: "warning", label: "Atenção", colorVar: "var(--color-warning)" },
  alerta: { tone: "danger", label: "Alerta", colorVar: "var(--color-negative)" },
  alta: { tone: "danger", label: "Alta", colorVar: "var(--color-negative)" },
  media: { tone: "warning", label: "Média", colorVar: "var(--color-warning)" },
};

const READ_MINUTES_DEFAULT = {
  daily: { theme: 3, general: 15 },
  weekly: { theme: 5, general: 30 },
} as const;

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Resolves the chip presentation (tone, label, colour token) for a severity.
 *
 * @param severity Raw severity value.
 * @returns Presentation metadata; falls back to the "ok" preset when unknown.
 */
export const resolveFluidaSeverity = (severity: FluidaSeverity): FluidaSeverityPresentation =>
  SEVERITY_PRESENTATION[severity] ?? SEVERITY_PRESENTATION.ok;

/**
 * Resolves the reading-time badge value, honouring the node value when present
 * and otherwise applying the cadence/scope defaults (3/15 daily, 5/30 weekly).
 *
 * @param nodeReadMin Reading time declared on the node, if any.
 * @param cadence Selected cadence.
 * @param isGeneral Whether the selection is the cross-cutting general reading.
 * @returns Reading time in minutes.
 */
export const resolveFluidaReadMinutes = (
  nodeReadMin: number | undefined,
  cadence: FluidaCadence,
  isGeneral: boolean,
): number => {
  if (typeof nodeReadMin === "number" && Number.isFinite(nodeReadMin)) {
    return nodeReadMin;
  }
  const defaults = READ_MINUTES_DEFAULT[cadence];
  return isGeneral ? defaults.general : defaults.theme;
};

/**
 * Builds the chart-ready series for the cadence, detecting the peak bar.
 *
 * @param source Insight source object.
 * @param cadence Selected cadence.
 * @returns Chart values, labels and the peak index/value.
 */
export const buildFluidaSeries = (
  source: FluidaInsightSource,
  cadence: FluidaCadence,
): FluidaChart => {
  const series = source.series[cadence];
  const values = series.values;

  let peakIndex = 0;
  let peakValue = values.length > 0 ? values[0]! : 0;
  values.forEach((value, index) => {
    if (value > peakValue) {
      peakValue = value;
      peakIndex = index;
    }
  });

  return { values, labels: series.labels, peakIndex, peakValue };
};

/**
 * Resolves the tab presentation (label, accent colour) for a theme id.
 *
 * @param source Insight source object.
 * @param theme Theme id.
 * @returns Theme metadata. The general tab uses the brand token.
 */
export const resolveFluidaThemeMeta = (
  source: FluidaInsightSource,
  theme: FluidaThemeId,
): FluidaThemeMeta => {
  if (theme === "general") {
    return { id: "general", label: "Geral", colorVar: "var(--fluida-brand)", isGeneral: true };
  }

  const themeSource = source.themes[theme];
  return {
    id: theme,
    label: themeSource?.label ?? "Geral",
    colorVar: themeSource?.color ?? "var(--fluida-brand)",
    isGeneral: false,
  };
};

/**
 * Formats a number as pt-BR BRL using its absolute value (sign dropped).
 *
 * @param value Amount to format.
 * @returns e.g. "R$ 11.000,00".
 */
export const formatFluidaCurrency = (value: number): string =>
  brlFormatter.format(Math.abs(value));

/**
 * Formats a signed amount with a leading glyph ("−"/"+") and pt-BR BRL value.
 *
 * @param value Amount to format.
 * @returns e.g. "− R$ 156,30" or "+ R$ 9.800,00".
 */
export const formatFluidaSignedCurrency = (value: number): string => {
  const glyph = value < 0 ? "−" : "+";
  return `${glyph} ${formatFluidaCurrency(value)}`;
};

/**
 * Resolves the active content node for a selection, falling back to the general
 * reading when the requested theme is unknown.
 *
 * @param source Insight source object.
 * @param selection Cadence + theme selection.
 * @returns The node plus the resolved theme id (collapsed to "general" on miss).
 */
const resolveActiveNode = (
  source: FluidaInsightSource,
  selection: FluidaSelection,
): { node: FluidaNode; themeId: FluidaThemeId; isGeneral: boolean } => {
  if (selection.theme === "general") {
    return { node: source.general[selection.cadence], themeId: "general", isGeneral: true };
  }

  const themeSource = source.themes[selection.theme];
  if (!themeSource) {
    return { node: source.general[selection.cadence], themeId: "general", isGeneral: true };
  }

  return { node: themeSource[selection.cadence], themeId: selection.theme, isGeneral: false };
};

/**
 * Maps a retro entry into a render-ready comparison card.
 *
 * @param entry Raw retro entry.
 * @returns Card with a signed amount label and sign flag.
 */
const toCompareCard = (entry: FluidaRetroEntry): FluidaCompareCard => ({
  when: entry.when,
  amountLabel: formatFluidaSignedCurrency(entry.value),
  isNegative: entry.value < 0,
  text: entry.text,
});

/**
 * Maps an alert entry into a render-ready card with resolved severity.
 *
 * @param entry Raw alert entry.
 * @returns Card with severity presentation.
 */
const toAlertCard = (entry: FluidaAlertEntry): FluidaAlertCard => ({
  text: entry.text,
  severity: resolveFluidaSeverity(entry.severity),
});

/**
 * Derives the full Fluida view model for a (cadence, theme) selection.
 *
 * General readings expose `compare` (3 retrospective cards) + `alerts`; theme
 * readings expose `highlights` (numeric tiles). The chart and pull-stat are
 * derived for every selection so the beat list renders generically.
 *
 * @param source Insight source object (mock today, DTO once the backend ships).
 * @param selection Cadence + theme selection.
 * @returns The derived view model.
 */
export const deriveFluidaView = (
  source: FluidaInsightSource,
  selection: FluidaSelection,
): FluidaView => {
  const { node, themeId, isGeneral } = resolveActiveNode(source, selection);
  const themeMeta = resolveFluidaThemeMeta(source, themeId);
  const chart = buildFluidaSeries(source, selection.cadence);

  const lead: FluidaLeadView = {
    kicker: themeMeta.label,
    accentColor: themeMeta.colorVar,
    severity: resolveFluidaSeverity(node.severity),
    readMinutes: resolveFluidaReadMinutes(node.readMin, selection.cadence, isGeneral),
    title: node.title,
    summary: node.summary,
  };

  const compare =
    isGeneral && node.retro && node.retro.length > 0
      ? node.retro.map(toCompareCard)
      : undefined;
  const alerts =
    isGeneral && node.alerts && node.alerts.length > 0
      ? node.alerts.map(toAlertCard)
      : undefined;
  const highlights =
    !isGeneral && node.highlights && node.highlights.length > 0 ? node.highlights : undefined;

  return {
    cadence: selection.cadence,
    themeId,
    isGeneral,
    lead,
    paragraphs: node.paragraphs,
    chart,
    nextStep: node.nextStep,
    meta: source.meta,
    compare,
    alerts,
    highlights,
    pullStat: node.pullStat,
  };
};
