<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed } from "vue";

import UiChart from "~/components/ui/UiChart.vue";
import { formatCurrency } from "~/utils/currency";
import { formatCurrencyShort } from "../../utils/format";

/** Série de um cartão na matriz mês × cartão. */
export interface StackedSeries {
  readonly name: string;
  readonly color: string;
  readonly values: readonly number[];
}

const props = withDefaults(
  defineProps<{
    monthLabels: readonly string[];
    series: readonly StackedSeries[];
    height?: string;
  }>(),
  { height: "260px" },
);

const option = computed<EChartsOption>(() => ({
  grid: { left: 6, right: 10, top: 16, bottom: 8, containLabel: true },
  tooltip: {
    trigger: "axis",
    valueFormatter: (value): string => formatCurrency(Number(value)),
  },
  legend: { show: false },
  xAxis: {
    type: "category",
    data: [...props.monthLabels],
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    axisLabel: { formatter: (value: number): string => formatCurrencyShort(Number(value)) },
  },
  series: props.series.map((entry) => ({
    name: entry.name,
    type: "bar",
    stack: "total",
    barMaxWidth: 38,
    emphasis: { focus: "series" },
    itemStyle: { color: entry.color },
    data: [...entry.values],
  })),
}));
</script>

<template>
  <UiChart :option="option" :height="props.height" />
</template>
