<script setup lang="ts">
import type { EChartsOption } from "echarts";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";
import { useChartSeriesMapper } from "~/composables/useChartSeriesMapper";

/** Props */
const props = defineProps<{
  /** Time series data from the dashboard overview query. */
  timeseries: DashboardTimeseriesPoint[];
  /** Whether the parent query is still loading. */
  loading?: boolean;
}>();

const { mapTimeseries } = useChartSeriesMapper();

/**
 * Builds the ECharts line chart option from the timeseries data.
 *
 * Uses `useChartSeriesMapper` for consistent colour assignment and PT-BR
 * label formatting, matching the rest of the dashboard.
 */
const chartOption = computed((): EChartsOption => {
  const { labels, series } = mapTimeseries(props.timeseries);

  return {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      bottom: 0,
      data: series.map((s) => s.name),
      textStyle: { fontSize: 11 },
    },
    grid: { left: 8, right: 8, top: 16, bottom: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10, rotate: labels.length > 10 ? 30 : 0 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } },
      axisLabel: { fontSize: 10 },
    },
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      data: s.data,
      smooth: true,
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: { color: s.color, opacity: 0.06 },
    })),
  };
});
</script>

<template>
  <UiChartPanel
    :title="$t('dashboard.charts.timeline')"
    :subtitle="$t('dashboard.charts.timelineSubtitle')"
    :loading="props.loading"
    chart-height="280px"
  >
    <UiEmptyState
      v-if="!props.loading && props.timeseries.length === 0"
      icon="chartLine"
      :title="$t('dashboard.noData')"
      :compact="true"
    />
    <UiChart
      v-else
      :option="chartOption"
      :update-key="props.timeseries.length"
      height="280px"
    />
  </UiChartPanel>
</template>
