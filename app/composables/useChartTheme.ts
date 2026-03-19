import type { EChartsOption } from "echarts";
import { colors } from "~/theme/tokens/colors";
import { fonts } from "~/theme/tokens/typography";

interface ChartThemeResult {
  auraxisEChartsTheme: Record<string, unknown>;
}

/**
 * Retorna o objeto de tema ECharts alinhado com os design tokens do Auraxis.
 * Use em conjunto com UiChart para garantir consistência visual.
 *
 * @returns Objeto de tema ECharts mapeado a partir dos design tokens do Auraxis.
 */
export function useChartTheme(): ChartThemeResult {
  const auraxisEChartsTheme: Record<string, unknown> = {
    backgroundColor: "transparent",

    textStyle: {
      fontFamily: fonts.body,
      color:      colors.text.secondary,
    },

    title: {
      textStyle: {
        color:      colors.text.primary,
        fontFamily: fonts.body,
      },
      subtextStyle: {
        color: colors.text.muted,
      },
    },

    legend: {
      textStyle: { color: colors.text.secondary },
      pageTextStyle: { color: colors.text.muted },
    },

    tooltip: {
      backgroundColor: colors.bg.elevated,
      borderColor:     colors.outline.soft,
      textStyle: {
        color: colors.text.primary,
      },
    },

    categoryAxis: {
      axisLine: { lineStyle: { color: colors.outline.subtle } },
      axisTick: { lineStyle: { color: colors.outline.subtle } },
      axisLabel: { color: colors.text.muted },
      splitLine: { lineStyle: { color: colors.outline.ghost, type: "dashed" } },
    },

    valueAxis: {
      axisLine: { lineStyle: { color: colors.outline.subtle } },
      axisTick: { lineStyle: { color: colors.outline.subtle } },
      axisLabel: { color: colors.text.muted },
      splitLine: { lineStyle: { color: colors.outline.ghost, type: "dashed" } },
    },

    // Paleta de séries — brand como primária, positive/negative como semânticos
    color: [
      colors.brand[600],
      colors.positive.DEFAULT,
      colors.brand[400],
      colors.negative.DEFAULT,
      colors.brand[800],
      colors.positive.dark,
    ],

    line: {
      lineStyle: { width: 2 },
      symbolSize: 6,
      smooth: false,
    },

    bar: {
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },

    pie: {
      itemStyle: {
        borderColor: colors.bg.surface,
        borderWidth: 2,
      },
    },
  };

  return { auraxisEChartsTheme };
}

// Re-export EChartsOption for convenience
export type { EChartsOption };
