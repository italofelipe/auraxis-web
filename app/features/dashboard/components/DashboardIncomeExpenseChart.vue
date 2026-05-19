<script setup lang="ts">
import type { EChartsOption } from "echarts";
import type { DashboardSummary } from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens } from "~/utils/chart-theme";

/** Props */
const props = defineProps<{
  /** Summary totals for the selected period. Null while loading. */
  summary: DashboardSummary | null;
  /** Whether the parent query is still loading. */
  loading?: boolean;
}>();

const { t } = useI18n();
const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

/**
 * Builds the ECharts option for the income vs expense bar chart.
 *
 * Uses design-token colours (positive / negative) so the chart automatically
 * adapts to light and dark themes.
 */
const chartOption = computed((): EChartsOption => ({
  tooltip: {
    trigger: "axis",
    backgroundColor: chartTokens.value.tooltipBackground,
    borderColor: chartTokens.value.tooltipBorder,
    textStyle: { color: chartTokens.value.tooltipText },
    formatter: (params: unknown): string => {
      const p = (Array.isArray(params) ? params[0] : params) as {
        name: string;
        value: number;
      };
      return `${p.name}: ${formatCurrency(p.value)}`;
    },
  },
  grid: { left: 8, right: 8, top: 16, bottom: 0, containLabel: true },
  xAxis: {
    type: "category",
    data: [t("dashboard.charts.income"), t("dashboard.charts.expense")],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTokens.value.mutedText },
  },
  yAxis: {
    type: "value",
    axisLabel: {
      color: chartTokens.value.mutedText,
      formatter: (v: number) => formatCurrency(v),
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: chartTokens.value.grid, type: "dashed" } },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 72,
      data: [
        {
          value: props.summary?.income ?? 0,
          itemStyle: { color: chartTokens.value.income, borderRadius: [4, 4, 0, 0] },
        },
        {
          value: props.summary?.expense ?? 0,
          itemStyle: { color: chartTokens.value.expense, borderRadius: [4, 4, 0, 0] },
        },
      ],
    },
  ],
}));
</script>

<template>
  <UiChartPanel
    :title="$t('dashboard.charts.incomeExpense')"
    :subtitle="$t('dashboard.charts.incomeExpenseSubtitle')"
    :loading="props.loading"
    chart-height="240px"
  >
    <UiChart
      :option="chartOption"
      :update-key="props.summary?.income ?? 0"
      height="240px"
    />
  </UiChartPanel>
</template>
