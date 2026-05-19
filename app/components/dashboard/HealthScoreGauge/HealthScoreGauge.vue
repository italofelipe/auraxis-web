<script setup lang="ts">
/**
 * HealthScoreGauge — PROD-01-2
 *
 * Circular ECharts gauge displaying a 0–100 financial health score.
 * Color semantics: red (< 40), amber (40–69), green (≥ 70).
 *
 * Issues: #563, #564 (parent PROD-01)
 */

import { computed } from "vue";
import type { EChartsOption } from "echarts";
import { useTheme } from "~/composables/useTheme";
import { themePalettes } from "~/theme/tokens/semantic";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Numeric score in [0, 100]. */
  score: number;
  /** Semantic tier that drives the colour. */
  tier: "good" | "fair" | "poor";
  /** Whether data is still loading. */
  loading?: boolean;
}>();

// ── Colour mapping ────────────────────────────────────────────────────────────

const { resolvedTheme } = useTheme();

const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const tierColors = computed<Record<"good" | "fair" | "poor", string>>(() => {
  const feedback = themePalettes[resolvedTheme.value].feedback;

  return {
    good: feedback.positive,
    fair: feedback.warning,
    poor: feedback.negative,
  };
});

const gaugeColor = computed(() => tierColors.value[props.tier]);

// ── ECharts option ────────────────────────────────────────────────────────────

const chartOption = computed((): EChartsOption => ({
  series: [
    {
      type: "gauge",
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      radius: "90%",
      center: ["50%", "60%"],
      pointer: { show: false },
      progress: {
        show: true,
        width: 12,
        itemStyle: { color: gaugeColor.value },
      },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[1, withAlpha(chartTokens.value.grid, resolvedTheme.value === "dark" ? 0.5 : 0.9)]],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        show: true,
        offsetCenter: [0, "-5%"],
        valueAnimation: true,
        formatter: (val: number) => `${Math.round(val)}`,
        fontSize: 32,
        fontWeight: "bold",
        color: gaugeColor.value,
        fontFamily: "Inter, sans-serif",
      },
      data: [{ value: props.score }],
    },
  ],
}));
</script>

<template>
  <div class="hsg" :aria-label="`Score de saúde financeira: ${score} de 100`">
    <BaseSkeleton v-if="loading" class="hsg__skeleton" />
    <template v-else>
      <UiChart
        :option="chartOption"
        :update-key="score"
        height="180px"
        class="hsg__chart"
      />
      <p :class="['hsg__tier', `hsg__tier--${tier}`]">
        {{ tier === 'good' ? 'Saudável' : tier === 'fair' ? 'Moderado' : 'Crítico' }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.hsg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.hsg__skeleton {
  width: 160px;
  height: 160px;
  border-radius: 50%;
}

.hsg__chart {
  width: 100%;
}

.hsg__tier {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hsg__tier--good  { color: var(--color-positive); }
.hsg__tier--fair  { color: var(--color-warning); }
.hsg__tier--poor  { color: var(--color-negative); }
</style>
