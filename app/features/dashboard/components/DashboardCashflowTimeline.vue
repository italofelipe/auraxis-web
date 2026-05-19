<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";
import { useLocaleDateFormat } from "~/composables/useLocaleDateFormat";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";

const props = defineProps<{
  points: DashboardTimeseriesPoint[];
  loading?: boolean;
}>();

const { t } = useI18n();
const { formatDate } = useLocaleDateFormat();
const { resolvedTheme } = useTheme();

const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const xLabels = computed(() =>
  props.points.map((p) =>
    formatDate(new Date(`${p.date}T00:00:00`), { day: "2-digit", month: "short" }),
  ),
);

const incomeData = computed(() => props.points.map((p) => p.income));
const expenseData = computed(() => props.points.map((p) => p.expense));
const balanceData = computed(() => props.points.map((p) => p.balance));

const chartOption = computed((): EChartsOption => ({
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "cross" },
    backgroundColor: chartTokens.value.tooltipBackground,
    borderColor: chartTokens.value.tooltipBorder,
    textStyle: { color: chartTokens.value.tooltipText },
    formatter: (params: unknown): string => {
      const items = Array.isArray(params) ? params : [params];
      const lines = (items as Array<{ seriesName: string; value: number; marker: string }>).map(
        (p) => `${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}`,
      );
      return lines.join("<br/>");
    },
  },
  legend: {
    bottom: 0,
    data: [
      t("pages.dashboard.cashflow.income"),
      t("pages.dashboard.cashflow.expense"),
      t("pages.dashboard.cashflow.balance"),
    ],
    textStyle: { color: chartTokens.value.mutedText, fontSize: 11 },
  },
  grid: { left: 8, right: 16, top: 16, bottom: 36, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: xLabels.value,
    axisLabel: { color: chartTokens.value.mutedText, fontSize: 10 },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: chartTokens.value.border } },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: chartTokens.value.grid, type: "dashed" } },
    axisLabel: {
      color: chartTokens.value.mutedText,
      fontSize: 10,
      formatter: (v: number) => formatCurrency(v),
    },
  },
  series: [
    {
      name: t("pages.dashboard.cashflow.income"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      data: incomeData.value,
      lineStyle: { color: chartTokens.value.income, width: 2 },
      itemStyle: { color: chartTokens.value.income },
      areaStyle: { color: withAlpha(chartTokens.value.income, 0.08) },
    },
    {
      name: t("pages.dashboard.cashflow.expense"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      data: expenseData.value,
      lineStyle: { color: chartTokens.value.expense, width: 2 },
      itemStyle: { color: chartTokens.value.expense },
      areaStyle: { color: withAlpha(chartTokens.value.expense, 0.08) },
    },
    {
      name: t("pages.dashboard.cashflow.balance"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      data: balanceData.value,
      lineStyle: { color: chartTokens.value.balance, width: 2, type: "dashed" },
      itemStyle: { color: chartTokens.value.balance },
    },
  ],
}));

const isEmpty = computed(() => !props.loading && props.points.length === 0);
</script>

<template>
  <UiChartPanel
    :title="$t('pages.dashboard.cashflow.title')"
    :subtitle="$t('pages.dashboard.cashflow.subtitle')"
    :loading="props.loading"
    chart-height="320px"
  >
    <UiEmptyState
      v-if="isEmpty"
      icon="chartLine"
      :title="$t('pages.dashboard.cashflow.emptyTitle')"
      :description="$t('pages.dashboard.cashflow.emptyDescription')"
      :compact="true"
    />

    <UiChart
      v-else
      :option="chartOption"
      :update-key="props.points.length"
      height="320px"
    />
  </UiChartPanel>
</template>
