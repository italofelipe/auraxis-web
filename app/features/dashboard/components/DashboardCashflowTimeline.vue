<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";
import { colors } from "~/theme/tokens/colors";
import { formatCurrency } from "~/utils/currency";
import { useLocaleDateFormat } from "~/composables/useLocaleDateFormat";

const props = defineProps<{
  points: DashboardTimeseriesPoint[];
  loading?: boolean;
}>();

const { t } = useI18n();
const { formatDate } = useLocaleDateFormat();

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
    textStyle: { fontSize: 11 },
  },
  grid: { left: 8, right: 16, top: 16, bottom: 36, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: xLabels.value,
    axisLabel: { fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { type: "dashed" } },
    axisLabel: {
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
      lineStyle: { color: colors.positive.DEFAULT, width: 2 },
      itemStyle: { color: colors.positive.DEFAULT },
      areaStyle: { color: colors.positive.DEFAULT, opacity: 0.08 },
    },
    {
      name: t("pages.dashboard.cashflow.expense"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      data: expenseData.value,
      lineStyle: { color: colors.negative.DEFAULT, width: 2 },
      itemStyle: { color: colors.negative.DEFAULT },
      areaStyle: { color: colors.negative.DEFAULT, opacity: 0.08 },
    },
    {
      name: t("pages.dashboard.cashflow.balance"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      data: balanceData.value,
      lineStyle: { color: colors.cyan[500], width: 2, type: "dashed" },
      itemStyle: { color: colors.cyan[500] },
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
