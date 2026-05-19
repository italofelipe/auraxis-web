import type { EChartsOption } from "echarts";
import { computed, type ComputedRef } from "vue";
import { useTheme } from "~/composables/useTheme";
import { buildAuraxisEChartsTheme } from "~/utils/chart-theme";

export interface ChartThemeResult {
  auraxisEChartsTheme: ComputedRef<Record<string, unknown>>;
}

/**
 * Retorna o objeto de tema ECharts alinhado com os design tokens do Auraxis.
 * Use em conjunto com UiChart para garantir consistência visual.
 *
 * @returns Objeto de tema ECharts mapeado a partir dos design tokens do Auraxis.
 */
export function useChartTheme(): ChartThemeResult {
  const { resolvedTheme } = useTheme();
  const auraxisEChartsTheme = computed(() => buildAuraxisEChartsTheme(resolvedTheme.value));

  return { auraxisEChartsTheme };
}

// Re-export EChartsOption for convenience
export type { EChartsOption };
