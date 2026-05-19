import { fonts } from "~/theme/tokens/typography";
import { themePalettes, type ResolvedTheme } from "~/theme/tokens/semantic";

export interface ChartThemeTokens {
  readonly axis: string;
  readonly background: string;
  readonly balance: string;
  readonly border: string;
  readonly debt: string;
  readonly expense: string;
  readonly grid: string;
  readonly income: string;
  readonly investment: string;
  readonly mutedText: string;
  readonly pieBorder: string;
  readonly primaryText: string;
  readonly series: readonly string[];
  readonly tooltipBackground: string;
  readonly tooltipBorder: string;
  readonly tooltipText: string;
}

/**
 * Converts a token colour into an rgba value.
 *
 * @param color Colour in #rgb, #rrggbb, rgb() or rgba() form.
 * @param alpha Alpha value between 0 and 1.
 * @returns CSS rgba colour.
 */
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
    const channels = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")")).split(",");
    const red = channels[0]?.trim() ?? "0";
    const green = channels[1]?.trim() ?? "0";
    const blue = channels[2]?.trim() ?? "0";

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const normalized = color.replace("#", "");
  const fullHex = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;
  const value = Number.parseInt(fullHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Builds chart tokens from the currently resolved app theme.
 *
 * @param theme Light or dark resolved theme.
 * @returns Theme-aware chart tokens for ECharts options.
 */
export function buildChartThemeTokens(theme: ResolvedTheme): ChartThemeTokens {
  const palette = themePalettes[theme];

  return {
    axis:              palette.chart.axis,
    background:        "transparent",
    balance:           palette.chart.balance,
    border:            palette.border.subtle,
    debt:              palette.chart.debt,
    expense:           palette.chart.expense,
    grid:              withAlpha(palette.chart.grid, theme === "dark" ? 0.18 : 0.64),
    income:            palette.chart.income,
    investment:        palette.chart.investment,
    mutedText:         palette.text.muted,
    pieBorder:         palette.bg.surface,
    primaryText:       palette.text.primary,
    series:            [
      palette.chart.balance,
      palette.chart.income,
      palette.chart.investment,
      palette.chart.expense,
      palette.chart.debt,
      palette.action.primaryHover,
    ],
    tooltipBackground: theme === "dark" ? withAlpha(palette.bg.elevated, 0.96) : palette.bg.surface,
    tooltipBorder:     theme === "dark"
      ? withAlpha(palette.chart.balance, 0.24)
      : palette.border.strong,
    tooltipText:       palette.text.primary,
  };
}

/**
 * Builds the global ECharts theme consumed by UiChart.
 *
 * @param theme Light or dark resolved theme.
 * @returns ECharts-compatible theme object.
 */
export function buildAuraxisEChartsTheme(theme: ResolvedTheme): Record<string, unknown> {
  const tokens = buildChartThemeTokens(theme);

  return {
    backgroundColor: tokens.background,
    textStyle:      {
      color:      tokens.mutedText,
      fontFamily: fonts.body,
    },
    title: {
      textStyle: {
        color:      tokens.primaryText,
        fontFamily: fonts.body,
      },
      subtextStyle: { color: tokens.mutedText },
    },
    legend: {
      textStyle:     { color: tokens.mutedText },
      pageTextStyle: { color: tokens.mutedText },
    },
    tooltip: {
      backgroundColor: tokens.tooltipBackground,
      borderColor:     tokens.tooltipBorder,
      textStyle:       { color: tokens.tooltipText },
    },
    categoryAxis: {
      axisLine:  { lineStyle: { color: tokens.border } },
      axisTick:  { lineStyle: { color: tokens.border } },
      axisLabel: { color: tokens.mutedText },
      splitLine: { lineStyle: { color: tokens.grid, type: "dashed" } },
    },
    valueAxis: {
      axisLine:  { lineStyle: { color: tokens.border } },
      axisTick:  { lineStyle: { color: tokens.border } },
      axisLabel: { color: tokens.mutedText },
      splitLine: { lineStyle: { color: tokens.grid, type: "dashed" } },
    },
    color: tokens.series,
    line:  {
      lineStyle: { width: 2 },
      smooth:    false,
      symbolSize: 6,
    },
    bar: {
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    },
    pie: {
      itemStyle: {
        borderColor: tokens.pieBorder,
        borderWidth: 2,
      },
    },
  };
}
