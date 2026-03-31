<script setup lang="ts">
import type { EChartsOption } from "echarts";
import type { DashboardSummary } from "~/features/dashboard/model/dashboard-overview";
import { colors } from "~/theme/tokens/colors";
import { formatCurrency } from "~/utils/currency";

/** Props */
const props = defineProps<{
  /** Summary totals for the selected period. Null while loading. */
  summary: DashboardSummary | null;
  /** Whether the parent query is still loading. */
  loading?: boolean;
}>();

const { t } = useI18n();

/**
 * Builds the ECharts option for the income vs expense bar chart.
 *
 * Uses design-token colours (positive / negative) so the chart automatically
 * adapts to light and dark themes.
 */
const chartOption = computed((): EChartsOption => ({
  tooltip: {
    trigger: "axis",
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
  },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: (v: number) => formatCurrency(v),
      fontSize: 10,
    },
    splitLine: { lineStyle: { type: "dashed" } },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 72,
      data: [
        {
          value: props.summary?.income ?? 0,
          itemStyle: { color: colors.positive.DEFAULT, borderRadius: [4, 4, 0, 0] },
        },
        {
          value: props.summary?.expense ?? 0,
          itemStyle: { color: colors.negative.DEFAULT, borderRadius: [4, 4, 0, 0] },
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
