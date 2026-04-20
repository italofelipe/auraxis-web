<script setup lang="ts">
/**
 * FinancialHealthScore — PROD-01-2
 *
 * Dashboard card that displays the Auraxis financial health score:
 *   • Circular gauge (HealthScoreGauge) with semantic colour
 *   • Pillar breakdown: progress bar + improvement tip per pillar
 *   • Sparkline history of the score over the last N months
 *
 * Issues: #563, #564 (parent PROD-01)
 */

import { computed } from "vue";
import type { EChartsOption } from "echarts";
import type { FinancialHealthScoreResult, HealthPillar } from "~/features/dashboard/composables/useFinancialHealthScore";

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Computed result from useFinancialHealthScore. */
  result: FinancialHealthScoreResult | null;
  /** Whether the underlying queries are still loading. */
  loading?: boolean;
}>();

// ── History sparkline ─────────────────────────────────────────────────────────

// ECharts does not resolve CSS variables — use token values directly.
const TIER_COLORS: Record<"good" | "fair" | "poor", string> = {
  good: "#42e8a9",   // DS v3 lime  (--color-positive)
  fair: "#ffb861",   // DS v3 orange (--color-warning)
  poor: "#ff6f79",   // DS v3 red   (--color-negative)
};

const historyOption = computed((): EChartsOption => {
  const history = props.result?.history ?? [];
  const tier = props.result?.tier ?? "poor";

  return {
    grid: { left: 0, right: 0, top: 4, bottom: 0, containLabel: false },
    xAxis: {
      type: "category",
      data: history.map((h) => h.month),
      show: false,
    },
    yAxis: { type: "value", min: 0, max: 100, show: false },
    series: [
      {
        type: "line",
        data: history.map((h) => h.score),
        smooth: true,
        symbol: "none",
        lineStyle: { color: TIER_COLORS[tier], width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${TIER_COLORS[tier]}40` },
              { offset: 1, color: `${TIER_COLORS[tier]}00` },
            ],
          },
        },
      },
    ],
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the progress percentage for a pillar progress bar.
 *
 * @param pillar HealthPillar with score and maxScore.
 * @returns Width percentage string for CSS.
 */
function pillarBarWidth(pillar: HealthPillar): string {
  if (pillar.score === null) { return "0%"; }
  return `${(pillar.score / pillar.maxScore) * 100}%`;
}

/**
 * Returns the display string for a pillar score.
 *
 * @param pillar HealthPillar with score.
 * @returns Formatted string or em dash when non-calculable.
 */
function pillarScoreDisplay(pillar: HealthPillar): string {
  return pillar.score === null ? "—" : `${Math.round(pillar.score)}/20`;
}

/**
 * Returns the CSS modifier class for the tier of a pillar.
 *
 * @param pillar HealthPillar with score and maxScore.
 * @returns CSS modifier string.
 */
function pillarTierClass(pillar: HealthPillar): string {
  if (pillar.score === null) { return "fhs__pillar-bar--unknown"; }
  const pct = pillar.score / pillar.maxScore;
  if (pct >= 0.7) { return "fhs__pillar-bar--good"; }
  if (pct >= 0.4) { return "fhs__pillar-bar--fair"; }
  return "fhs__pillar-bar--poor";
}
</script>

<template>
  <UiSurfaceCard class="fhs">
    <template #header>
      <span class="fhs__header-title">Saúde Financeira</span>
    </template>

    <!-- ── Loading skeletons ─────────────────────────────────────────────── -->
    <template v-if="loading">
      <BaseSkeleton class="fhs__gauge-skeleton" />
      <div class="fhs__pillars">
        <BaseSkeleton v-for="n in 5" :key="n" class="fhs__pillar-skeleton" />
      </div>
    </template>

    <!-- ── Score content ─────────────────────────────────────────────────── -->
    <template v-else-if="result">
      <div class="fhs__top">
        <!-- Gauge -->
        <HealthScoreGauge
          :score="result.totalScore"
          :tier="result.tier"
          class="fhs__gauge"
        />

        <!-- Sparkline history -->
        <div v-if="result.history.length > 1" class="fhs__history">
          <p class="fhs__history-label">Evolução ({{ result.history.length }}m)</p>
          <UiChart
            :option="historyOption"
            :update-key="result.totalScore"
            height="64px"
            class="fhs__sparkline"
          />
        </div>
      </div>

      <!-- ── Pillar breakdown ─────────────────────────────────────────────── -->
      <ul class="fhs__pillars" role="list" aria-label="Pilares de saúde financeira">
        <li
          v-for="pillar in result.pillars"
          :key="pillar.key"
          class="fhs__pillar"
        >
          <div class="fhs__pillar-header">
            <span class="fhs__pillar-label">{{ pillar.label }}</span>
            <span class="fhs__pillar-score">{{ pillarScoreDisplay(pillar) }}</span>
          </div>
          <div class="fhs__pillar-track" role="progressbar" :aria-valuenow="pillar.score ?? 0" aria-valuemin="0" aria-valuemax="20">
            <span
              :class="['fhs__pillar-bar', pillarTierClass(pillar)]"
              :style="{ width: pillarBarWidth(pillar) }"
            />
          </div>
          <p class="fhs__pillar-tip">{{ pillar.tip }}</p>
        </li>
      </ul>
    </template>

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    <UiEmptyState
      v-else
      icon="chartLine"
      title="Score indisponível"
      description="Adicione transações e investimentos para calcular sua saúde financeira."
      :compact="true"
    />
  </UiSurfaceCard>
</template>

<style scoped>
.fhs {
  display: grid;
  gap: var(--space-3);
}

.fhs__header-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

/* ── Gauge ──────────────────────────────────────────────────────────────────── */
.fhs__gauge-skeleton {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  margin: 0 auto;
}

.fhs__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  align-items: center;
}

.fhs__gauge {
  max-width: 200px;
}

/* ── Sparkline ──────────────────────────────────────────────────────────────── */
.fhs__history {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fhs__history-label {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fhs__sparkline {
  border-radius: var(--radius-sm);
}

/* ── Pillars ────────────────────────────────────────────────────────────────── */
.fhs__pillars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.fhs__pillar-skeleton {
  height: 52px;
  border-radius: var(--radius-sm);
}

.fhs__pillar {
  display: grid;
  gap: 4px;
}

.fhs__pillar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-1);
}

.fhs__pillar-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.fhs__pillar-score {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.fhs__pillar-track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
  overflow: hidden;
}

.fhs__pillar-bar {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.fhs__pillar-bar--good    { background: var(--color-positive); }
.fhs__pillar-bar--fair    { background: var(--color-warning); }
.fhs__pillar-bar--poor    { background: var(--color-negative); }
.fhs__pillar-bar--unknown { background: var(--color-outline-soft); }

.fhs__pillar-tip {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}

@media (max-width: 600px) {
  .fhs__top {
    grid-template-columns: 1fr;
  }
}
</style>
