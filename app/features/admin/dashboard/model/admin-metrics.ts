import type { EChartsOption } from "echarts";

import type { ChartThemeTokens } from "~/utils/chart-theme";

/** Metric blocks exposed by the admin metrics API. */
export type AdminMetricsBlock = "users" | "premium" | "ai" | "activity";

/** Supported aggregation intervals for timeseries queries. */
export type AdminMetricsInterval = "day" | "week";

/** Dimensions supported by the AI breakdown endpoint. */
export type AdminAiBreakdownBy = "model" | "endpoint" | "user";

/** Cache metadata reported by the overview endpoint. */
export interface AdminMetricsCacheInfo {
  readonly hit: boolean;
  readonly ttlSeconds: number;
}

/** Users & growth block of the overview. */
export interface AdminUsersMetrics {
  readonly total: number;
  readonly verified: number;
  readonly blocked: number;
  readonly new7d: number;
  readonly new30d: number;
  readonly active7d: number;
  readonly active30d: number;
  readonly activeSource: string;
}

/** Premium & conversion block of the overview. */
export interface AdminPremiumMetrics {
  readonly subscriptionsActive: number;
  readonly trialsActive: number;
  readonly overridesActive: number;
  readonly entitledUsers: number;
  readonly newSubscriptions30d: number;
  readonly conversionPct: number;
}

/** AI usage & cost block of the overview. */
export interface AdminAiMetrics {
  readonly calls7d: number;
  readonly tokens7d: number;
  readonly costUsd7d: number;
  readonly costUsdMtd: number;
  readonly avgLatencyMs7d: number;
  readonly activeUsers7d: number;
}

/** Product activity block of the overview. */
export interface AdminActivityMetrics {
  readonly transactions7d: number;
  readonly goalContributions7d: number;
  readonly goalsCreated7d: number;
  readonly budgetsActive: number;
  readonly simulations7d: number;
  readonly insightRuns7d: number;
}

/** Aggregated product metrics for the admin dashboard. */
export interface AdminMetricsOverview {
  readonly generatedAt: string;
  readonly cache: AdminMetricsCacheInfo;
  readonly users: AdminUsersMetrics;
  readonly premium: AdminPremiumMetrics;
  readonly ai: AdminAiMetrics;
  readonly activity: AdminActivityMetrics;
}

/** One dated point of a metrics timeseries; metric keys follow the API contract. */
export interface AdminTimeseriesPoint {
  readonly date: string;
  readonly values: Readonly<Record<string, number>>;
}

/** One block timeseries as returned by the metrics API. */
export interface AdminMetricsTimeseries {
  readonly block: AdminMetricsBlock;
  readonly interval: AdminMetricsInterval;
  readonly points: readonly AdminTimeseriesPoint[];
}

/** One aggregated row of the AI breakdown. */
export interface AdminAiBreakdownRow {
  readonly key: string;
  readonly userEmail: string | null;
  readonly calls: number;
  readonly tokens: number;
  readonly costUsd: number;
  readonly avgLatencyMs: number;
}

/** AI usage grouped by model, endpoint or user. */
export interface AdminAiBreakdown {
  readonly by: AdminAiBreakdownBy;
  readonly rows: readonly AdminAiBreakdownRow[];
}

/** Inclusive date window used by timeseries queries. */
export interface AdminMetricsDateRange {
  readonly from: string;
  readonly to: string;
}

/** One KPI tile of a dashboard block (view model). */
export interface AdminMetricsTile {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}

/** Sentinel emitted by the backend while "active" is derived from refresh tokens. */
export const REFRESH_TOKENS_PROXY_SOURCE = "refresh_tokens_proxy";

/**
 * @param source `active_source` reported by the overview endpoint.
 * @returns True while active users are approximated by session refreshes.
 */
export const isActiveSourceProxy = (source: string): boolean =>
  source === REFRESH_TOKENS_PROXY_SOURCE;

/**
 * @param value ISO instant inside the target day.
 * @returns The UTC calendar date in YYYY-MM-DD form.
 */
const toUtcDate = (value: Date): string => value.toISOString().slice(0, 10);

/**
 * Builds the inclusive UTC window ending at the reference date.
 *
 * @param reference Instant anchoring the end of the window.
 * @param days Total days in the window, including the reference day.
 * @returns From/to pair formatted as YYYY-MM-DD.
 */
export const metricsDateRange = (reference: Date, days: number): AdminMetricsDateRange => {
  const from = new Date(reference.getTime());
  from.setUTCDate(from.getUTCDate() - (days - 1));

  return { from: toUtcDate(from), to: toUtcDate(reference) };
};

/**
 * @param part Portion of the total.
 * @param total Whole amount the part belongs to.
 * @returns Percentage points (0–100), or null when the total is zero.
 */
export const percentOf = (part: number, total: number): number | null =>
  total === 0 ? null : (part / total) * 100;

/**
 * @param isoDate Calendar date in YYYY-MM-DD form.
 * @returns Compact pt-BR day/month label (dd/mm).
 */
export const formatShortDate = (isoDate: string): string => {
  const [, month, day] = isoDate.split("-");

  return `${day}/${month}`;
};

/**
 * @param series Block timeseries.
 * @returns Category labels (dd/mm) aligned with the series points.
 */
export const seriesDateLabels = (series: AdminMetricsTimeseries): string[] =>
  series.points.map((point) => formatShortDate(point.date));

/**
 * @param series Block timeseries.
 * @param key Metric key from the API contract (e.g. `signups`).
 * @returns Metric values aligned with the series points; missing keys become 0.
 */
export const seriesValues = (series: AdminMetricsTimeseries, key: string): number[] =>
  series.points.map((point) => point.values[key] ?? 0);

/**
 * @param value Integer counter.
 * @returns pt-BR grouped integer (e.g. `45.000`).
 */
export const formatMetricInt = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);

/**
 * @param value Large counter (e.g. tokens).
 * @returns Compact pt-BR figure (e.g. `45 mil`).
 */
export const formatCompactInt = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/**
 * @param value Amount in US dollars.
 * @returns pt-BR formatted USD currency (e.g. `US$ 1,23`).
 */
export const formatUsd = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(value);

/**
 * @param value Percentage points already scaled to 0–100.
 * @returns pt-BR percentage with one decimal (e.g. `13,3%`).
 */
export const formatMetricPct = (value: number): string => {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted}%`;
};

/**
 * @param value Latency in milliseconds.
 * @returns Grouped milliseconds label (e.g. `900 ms`).
 */
export const formatLatency = (value: number): string => `${formatMetricInt(value)} ms`;

/**
 * @param generatedAt ISO instant reported by the overview endpoint.
 * @returns Local pt-BR HH:mm time, or an empty string for invalid input.
 */
export const formatGeneratedAt = (generatedAt: string): string => {
  const parsed = new Date(generatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(parsed);
};

/** One named line of a multi-line chart. */
export interface AdminChartLineSeries {
  readonly name: string;
  readonly values: readonly number[];
  readonly color: string;
}

interface MultiLineOptionInput {
  readonly labels: readonly string[];
  readonly series: readonly AdminChartLineSeries[];
  readonly tokens: ChartThemeTokens;
  readonly valueFormatter?: (value: number) => string;
  /** Locks the value axis to whole-number ticks (count series). */
  readonly integerAxis?: boolean;
}

interface BarOptionInput {
  readonly labels: readonly string[];
  readonly name: string;
  readonly values: readonly number[];
  readonly color: string;
  readonly tokens: ChartThemeTokens;
  readonly valueFormatter?: (value: number) => string;
  /** Locks the value axis to whole-number ticks (count series). */
  readonly integerAxis?: boolean;
}

/**
 * @param tokens Theme-aware chart tokens.
 * @param valueFormatter Optional per-value formatter for tooltips/ticks.
 * @param integerAxis When true, forbids fractional axis ticks so integer
 *   formatters never render duplicate labels (e.g. 0/0/1/1).
 * @returns Shared cartesian scaffolding (axes, grid, tooltip) for dashboard charts.
 */
const cartesianBase = (
  tokens: ChartThemeTokens,
  valueFormatter?: (value: number) => string,
  integerAxis?: boolean,
): Pick<EChartsOption, "grid" | "tooltip" | "yAxis"> => ({
  grid: { left: 8, right: 8, top: 32, bottom: 0, containLabel: true },
  tooltip: {
    trigger: "axis",
    backgroundColor: tokens.tooltipBackground,
    borderColor: tokens.tooltipBorder,
    textStyle: { color: tokens.tooltipText },
    ...(valueFormatter
      ? { valueFormatter: (value): string => valueFormatter(Number(value)) }
      : {}),
  },
  yAxis: {
    type: "value",
    ...(integerAxis ? { minInterval: 1 } : {}),
    axisLabel: {
      color: tokens.mutedText,
      fontSize: 10,
      ...(valueFormatter ? { formatter: (value: number): string => valueFormatter(value) } : {}),
    },
    // Solid hairline gridlines — recessive, one step off the surface.
    splitLine: { lineStyle: { color: tokens.grid, width: 1, type: "solid" } },
  },
});

/**
 * @param labels Category labels (dd/mm).
 * @param tokens Theme-aware chart tokens.
 * @returns Category x-axis without axis ink.
 */
const categoryAxis = (
  labels: readonly string[],
  tokens: ChartThemeTokens,
): EChartsOption["xAxis"] => ({
  type: "category",
  data: [...labels],
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: tokens.mutedText, fontSize: 10 },
});

/**
 * Builds a themed multi-line ECharts option (2px lines, surface-ringed markers,
 * legend always visible for series identity).
 *
 * @param input Labels, named series and theme tokens.
 * @returns ECharts option for a categorical line chart.
 */
export const buildMultiLineOption = (input: MultiLineOptionInput): EChartsOption => ({
  ...cartesianBase(input.tokens, input.valueFormatter, input.integerAxis),
  legend: {
    show: true,
    top: 0,
    left: 0,
    icon: "circle",
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: input.tokens.mutedText, fontSize: 11 },
  },
  xAxis: categoryAxis(input.labels, input.tokens),
  series: input.series.map((line) => ({
    name: line.name,
    type: "line",
    data: [...line.values],
    color: line.color,
    lineStyle: { width: 2, cap: "round", join: "round" },
    symbol: "circle",
    symbolSize: 8,
    showSymbol: false,
    // 2px surface ring keeps hovered markers legible where lines overlap.
    itemStyle: { color: line.color, borderColor: input.tokens.pieBorder, borderWidth: 2 },
  })),
});

/**
 * Builds a themed single-series bar option (thin bars, 4px rounded data ends,
 * square baseline, no legend — the panel title names the series).
 *
 * @param input Labels, series name, values and theme tokens.
 * @returns ECharts option for a single-series bar chart.
 */
export const buildBarOption = (input: BarOptionInput): EChartsOption => {
  const base = cartesianBase(input.tokens, input.valueFormatter, input.integerAxis);

  return {
    ...base,
    tooltip: {
      ...(base.tooltip as Record<string, unknown>),
      axisPointer: { type: "shadow" },
    },
    xAxis: categoryAxis(input.labels, input.tokens),
    series: [
      {
        name: input.name,
        type: "bar",
        data: [...input.values],
        barMaxWidth: 20,
        itemStyle: { color: input.color, borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
};
