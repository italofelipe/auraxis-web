<script setup lang="ts">
import { computed } from "vue";
import { PiggyBank } from "lucide-vue-next";
import type { EChartsOption } from "echarts";
import type { DashboardSummary } from "~/features/dashboard/model/dashboard-overview";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiTrendBadge from "~/components/ui/UiTrendBadge/UiTrendBadge.vue";
import { colors } from "~/theme/tokens/colors";

const props = defineProps<{
  summary: DashboardSummary | null;
  previousSummary?: DashboardSummary | null;
  loading?: boolean;
}>();

/**
 * Computes the savings rate as `balance / income * 100`.
 * Returns null when income is zero or summary is missing.
 *
 * @param summary Period summary or null/undefined when unavailable.
 * @returns Savings rate in percent, or null when income is non-positive.
 */
function savingsRate(summary: DashboardSummary | null | undefined): number | null {
  if (!summary || summary.income <= 0) {return null;}
  return (summary.balance / summary.income) * 100;
}

const currentRate = computed(() => savingsRate(props.summary));
const previousRate = computed(() => savingsRate(props.previousSummary ?? null));

const delta = computed((): number | null => {
  if (currentRate.value === null || previousRate.value === null) {return null;}
  return currentRate.value - previousRate.value;
});

const displayValue = computed(() => {
  if (currentRate.value === null) {return "—";}
  const clamped = Math.max(-100, Math.min(100, currentRate.value));
  const sign = clamped > 0 ? "+" : "";
  return `${sign}${clamped.toFixed(1).replace(".", ",")}%`;
});

const healthCopy = computed(() => {
  if (currentRate.value === null) {
    return { tone: "neutral" as const, label: "emptyHint" };
  }
  if (currentRate.value >= 20) {return { tone: "positive" as const, label: "healthy" };}
  if (currentRate.value >= 10) {return { tone: "warning" as const, label: "acceptable" };}
  if (currentRate.value >= 0) {return { tone: "warning" as const, label: "tight" };}
  return { tone: "negative" as const, label: "deficit" };
});

const gaugeColor = computed((): string => {
  if (healthCopy.value.tone === "positive") {return colors.positive.DEFAULT;}
  if (healthCopy.value.tone === "warning") {return colors.orange[500];}
  if (healthCopy.value.tone === "negative") {return colors.negative.DEFAULT;}
  return colors.cyan[500];
});

const gaugeOption = computed((): EChartsOption => {
  const raw = currentRate.value ?? 0;
  const value = Math.max(-40, Math.min(60, raw));
  return {
    series: [
      {
        type: "gauge",
        min: -40,
        max: 60,
        splitNumber: 5,
        radius: "95%",
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.3, colors.negative.DEFAULT],
              [0.5, colors.orange[500]],
              [1, colors.positive.DEFAULT],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          show: false,
        },
        anchor: { show: false },
        progress: { show: false },
        data: [
          {
            value,
            itemStyle: { color: gaugeColor.value },
          },
        ],
      },
    ],
  };
});
</script>

<template>
  <UiSurfaceCard class="savings-rate-card">
    <header class="savings-rate-card__header">
      <div class="savings-rate-card__label">
        <PiggyBank :size="16" aria-hidden="true" />
        <span>{{ $t('pages.dashboard.savingsRate.title') }}</span>
      </div>
    </header>

    <div v-if="props.loading" class="savings-rate-card__skeleton" aria-busy="true" />

    <div v-else class="savings-rate-card__body">
      <div class="savings-rate-card__value-group">
        <p class="savings-rate-card__value" :class="`savings-rate-card__value--${healthCopy.tone}`">
          {{ displayValue }}
        </p>
        <UiTrendBadge
          v-if="delta !== null"
          :value="delta"
          :decimals="1"
        />
      </div>

      <p class="savings-rate-card__helper">
        {{ $t(`pages.dashboard.savingsRate.${healthCopy.label}`) }}
      </p>

      <ClientOnly>
        <UiChart
          :option="gaugeOption"
          :update-key="currentRate ?? 'empty'"
          height="80px"
        />
      </ClientOnly>
    </div>
  </UiSurfaceCard>
</template>

<style scoped>
.savings-rate-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.savings-rate-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.savings-rate-card__label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.savings-rate-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.savings-rate-card__value-group {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.savings-rate-card__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}
.savings-rate-card__value--positive { color: var(--color-positive); }
.savings-rate-card__value--warning  { color: var(--color-warning, #ffb861); }
.savings-rate-card__value--negative { color: var(--color-negative); }
.savings-rate-card__value--neutral  { color: var(--color-text-primary); }
.savings-rate-card__helper {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  min-height: 1.25em;
}
.savings-rate-card__skeleton {
  height: 120px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
