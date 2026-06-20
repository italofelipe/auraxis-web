<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed } from "vue";

import UiChart from "~/components/ui/UiChart.vue";
import { formatCurrency } from "~/utils/currency";

const props = withDefaults(
  defineProps<{
    labels: readonly string[];
    values: readonly number[];
    color: string;
    height?: string;
  }>(),
  { height: "150px" },
);

const option = computed<EChartsOption>(() => ({
  grid: { left: 4, right: 10, top: 12, bottom: 4, containLabel: true },
  tooltip: {
    trigger: "axis",
    valueFormatter: (value): string => formatCurrency(Number(value)),
  },
  xAxis: {
    type: "category",
    data: [...props.labels],
    boundaryGap: false,
    axisTick: { show: false },
  },
  yAxis: { type: "value", show: false },
  series: [
    {
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2, color: props.color },
      itemStyle: { color: props.color },
      areaStyle: { color: props.color, opacity: 0.12 },
      data: [...props.values],
    },
  ],
}));
</script>

<template>
  <UiChart :option="option" :height="props.height" />
</template>
