<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import {
  formatFluidaCurrency,
  type FluidaCadence,
  type FluidaChart,
} from "../model/insight-fluida";

const props = defineProps<{
  chart: FluidaChart;
  cadence: FluidaCadence;
}>();

const { t } = useI18n();

const title = computed(() =>
  props.cadence === "daily" ? t("insights.fluida.chart.daily") : t("insights.fluida.chart.weekly"),
);

const peakLabel = computed(() =>
  t("insights.fluida.chart.peak", { value: formatFluidaCurrency(props.chart.peakValue) }),
);

/**
 * Reads a CSS custom property off the document root, falling back when running
 * server-side (no DOM) or when the variable is unset.
 *
 * @param token CSS variable name, e.g. "--fluida-track".
 * @param fallback Value used during SSR or when the token is empty.
 * @returns The resolved colour string.
 */
const resolveCssVar = (token: string, fallback: string): string => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value.length > 0 ? value : fallback;
};

/**
 * ECharts bar option for the "ritmo de saídas" beat. The peak bar is painted
 * with the editorial negative colour; the others use the muted track colour.
 * Colours resolve `var(--fluida-*)` at runtime so they follow the active theme.
 */
const option = computed<EChartsOption>(() => {
  const trackColor = resolveCssVar("--fluida-track", "#e7ebed");
  const peakColor = resolveCssVar("--fluida-neg", "#e5484d");
  const axisColor = resolveCssVar("--fluida-muted", "#8a979d");

  return {
    grid: { top: 8, right: 4, bottom: 22, left: 4, containLabel: true },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value): string => formatFluidaCurrency(Number(value)),
    },
    xAxis: {
      type: "category",
      data: [...props.chart.labels],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: axisColor, fontSize: 10, fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "bar",
        data: props.chart.values.map((value, index) => ({
          value,
          itemStyle: {
            color: index === props.chart.peakIndex ? peakColor : trackColor,
            borderRadius: [5, 5, 0, 0],
          },
        })),
        barMaxWidth: 30,
      },
    ],
  };
});

const chartKey = computed(
  () => `${props.cadence}-${props.chart.values.length}-${props.chart.peakIndex}`,
);
</script>

<template>
  <div class="fluida-chart">
    <div class="fluida-chart__head">
      <span class="fluida-chart__title">{{ title }}</span>
      <span class="fluida-chart__peak">{{ peakLabel }}</span>
    </div>
    <UiChart
      :option="option"
      :update-key="chartKey"
      height="120px"
      :aria-label="t('insights.fluida.chart.ariaLabel')"
    />
  </div>
</template>

<style scoped>
.fluida-chart {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--fluida-radius-chart);
  background: var(--fluida-surface);
  box-shadow: var(--fluida-shadow);
}

.fluida-chart__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.fluida-chart__title {
  font-size: var(--fluida-size-section);
  font-weight: var(--fluida-weight-heavy);
  color: var(--fluida-ink);
}

.fluida-chart__peak {
  font-size: var(--fluida-size-caption);
  font-weight: var(--fluida-weight-semibold);
  color: var(--fluida-muted);
}
</style>
