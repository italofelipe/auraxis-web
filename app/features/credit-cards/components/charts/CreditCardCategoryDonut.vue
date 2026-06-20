<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed } from "vue";

import UiChart from "~/components/ui/UiChart.vue";
import { formatCurrency } from "~/utils/currency";

/** Fatia do donut de categorias. */
export interface DonutSlice {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

const props = withDefaults(
  defineProps<{
    slices: readonly DonutSlice[];
    centerValue: string;
    centerLabel?: string;
    height?: string;
  }>(),
  { centerLabel: "", height: "240px" },
);

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: "item",
    valueFormatter: (value): string => formatCurrency(Number(value)),
  },
  series: [
    {
      type: "pie",
      radius: ["58%", "82%"],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: props.slices.map((slice) => ({
        name: slice.name,
        value: slice.value,
        itemStyle: { color: slice.color },
      })),
    },
  ],
}));
</script>

<template>
  <div class="cc-donut">
    <UiChart :option="option" :height="props.height" />
    <div class="cc-donut__center" aria-hidden="true">
      <span v-if="props.centerLabel" class="cc-donut__label">{{ props.centerLabel }}</span>
      <strong class="cc-donut__value">{{ props.centerValue }}</strong>
    </div>
  </div>
</template>

<style scoped>
.cc-donut {
  position: relative;
}
.cc-donut__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  pointer-events: none;
}
.cc-donut__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.cc-donut__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
</style>
