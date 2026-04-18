import type { EChartsOption } from "echarts";
import { colors } from "~/theme/tokens/colors";
import { fonts } from "~/theme/tokens/typography";

export interface ChartThemeResult {
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
      borderColor:     colors.border.subtle,
      textStyle: {
        color: colors.text.primary,
      },
    },

    categoryAxis: {
      axisLine: { lineStyle: { color: colors.border.subtle } },
      axisTick: { lineStyle: { color: colors.border.subtle } },
      axisLabel: { color: colors.text.muted },
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)", type: "dashed" } },
    },

    valueAxis: {
      axisLine: { lineStyle: { color: colors.border.subtle } },
      axisTick: { lineStyle: { color: colors.border.subtle } },
      axisLabel: { color: colors.text.muted },
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)", type: "dashed" } },
    },

    // Paleta de séries — cyan/lime/violet como primárias, positive/negative como semânticos
    color: [
      colors.cyan[500],
      colors.positive.DEFAULT,
      colors.violet[500],
      colors.negative.DEFAULT,
      colors.orange[500],
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
