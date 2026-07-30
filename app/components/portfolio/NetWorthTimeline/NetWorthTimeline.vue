<script setup lang="ts">
import type { EChartsOption } from "echarts";

import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import {
  NET_WORTH_SCENARIOS,
  type NetWorthHorizon,
  type NetWorthProjectionInput,
  type NetWorthScenarioId,
  useNetWorthProjection,
} from "~/features/portfolio/composables/useNetWorthProjection";
import { formatCurrency } from "~/utils/currency";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";

interface Props {
  readonly currentNetWorth: number;
  readonly investedAmount: number;
  readonly goals?: readonly GoalDto[];
  readonly monthlyContribution?: number;
  readonly anchorDate?: string;
}

const props = withDefaults(defineProps<Props>(), {
  goals: () => [],
  monthlyContribution: 0,
  anchorDate: "",
});

const horizons: readonly NetWorthHorizon[] = [12, 24, 60];
const horizonMonths = ref<NetWorthHorizon>(24);

const anchorDate = computed(() => props.anchorDate || new Date().toISOString().slice(0, 10));
const projectedContribution = computed(() => {
  if (props.monthlyContribution > 0) {
    return props.monthlyContribution;
  }

  return Math.max(500, Math.round(props.currentNetWorth * 0.012));
});

const projectionInput = computed<NetWorthProjectionInput>(() => ({
  anchorDate: anchorDate.value,
  currentNetWorth: props.currentNetWorth,
  investedAmount: props.investedAmount,
  horizonMonths: horizonMonths.value,
  monthlyContribution: projectedContribution.value,
  goals: props.goals,
}));

const projection = useNetWorthProjection(projectionInput);

const { resolvedTheme } = useTheme();

const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

/** Cenários herdam a paleta de gráficos do tema ativo. */
const scenarioColors = computed<Record<NetWorthScenarioId, string>>(() => ({
  optimistic: chartTokens.value.income,
  base: chartTokens.value.balance,
  pessimistic: chartTokens.value.debt,
}));

/** Marcadores de meta desenhados sobre a linha do cenário base. */
const goalMarkPoints = computed(() => projection.value.goalMarkers.map((marker) => ({
  name: marker.label,
  coord: [marker.monthOffset, marker.value],
  value: marker.label,
})));

const chartSeries = computed(() => {
  const tokens = chartTokens.value;
  const scenarios = scenarioColors.value;
  const markPointData = goalMarkPoints.value;

  return [
    {
      name: "Patrimônio real",
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { width: 3, type: "solid" },
      areaStyle: { color: withAlpha(tokens.axis, 0.08) },
      data: projection.value.actualSeries.map((point) => [point.monthOffset, point.value]),
    },
    ...NET_WORTH_SCENARIOS.map((scenario) => ({
      name: `Cenário ${scenario.label.toLowerCase()}`,
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { width: scenario.id === "base" ? 3 : 2, type: "dashed" },
      itemStyle: { color: scenarios[scenario.id] },
      data: projection.value.projectedSeries[scenario.id].map((point) => [point.monthOffset, point.value]),
      markPoint: scenario.id === "base" && markPointData.length > 0
        ? {
            symbol: "pin",
            symbolSize: 42,
            // pieBorder é a superfície do tema: contrasta com o pin nos dois.
            label: { color: tokens.pieBorder, formatter: "Meta" },
            itemStyle: { color: scenarios.base },
            data: markPointData,
          }
        : undefined,
    })),
  ];
});

const chartOption = computed<EChartsOption>(() => {
  const tokens = chartTokens.value;
  const scenarios = scenarioColors.value;

  return {
    backgroundColor: tokens.background,
    color: [tokens.axis, scenarios.optimistic, scenarios.base, scenarios.pessimistic],
    // A legenda tem 4 itens e quebra em duas linhas em telas estreitas; sem essa
    // folga no topo ela cobre o primeiro rótulo do eixo Y.
    grid: { top: 64, right: 20, bottom: 34, left: 64 },
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.tooltipBackground,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
      valueFormatter: (value): string => typeof value === "number" ? formatCurrency(value) : "-",
    },
    legend: {
      top: 0,
      left: "center",
      itemGap: 12,
      textStyle: { color: tokens.mutedText },
    },
    xAxis: {
      type: "value",
      min: -12,
      max: horizonMonths.value,
      boundaryGap: [0, 0],
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.mutedText,
        formatter: (value: number): string => {
          if (value === 0) {
            return "Hoje";
          }

          return value > 0 ? `+${value}m` : `${value}m`;
        },
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: tokens.grid } },
      axisLabel: {
        color: tokens.mutedText,
        formatter: (value: number): string => `${Math.round(value / 1000)}k`,
      },
    },
    series: chartSeries.value,
  } as EChartsOption;
});

const baseFinalValue = computed(() => projection.value.finalValues.base);
const optimisticDelta = computed(() => projection.value.finalValues.optimistic - projection.value.finalValues.base);
const nearestGoal = computed(() => projection.value.goalMarkers[0] ?? null);
</script>

<template>
  <section class="net-worth-timeline" aria-labelledby="net-worth-timeline-title">
    <div class="net-worth-timeline__header">
      <div>
        <p class="net-worth-timeline__eyebrow">Cenários de longo prazo</p>
        <h2 id="net-worth-timeline-title">Projeção Patrimonial</h2>
        <span>Patrimônio real em linha sólida e cenários futuros em linha pontilhada.</span>
      </div>

      <div class="net-worth-timeline__horizons" aria-label="Horizonte da projeção patrimonial">
        <button
          v-for="horizon in horizons"
          :key="horizon"
          type="button"
          :data-horizon="horizon"
          :class="{ 'is-active': horizonMonths === horizon }"
          @click="horizonMonths = horizon"
        >
          {{ horizon }}m
        </button>
      </div>
    </div>

    <div class="net-worth-timeline__body">
      <UiChart :option="chartOption" height="340px" :update-key="String(horizonMonths)" />

      <div class="net-worth-timeline__aside" aria-label="Resumo da projeção">
        <div>
          <span>Aporte mensal</span>
          <strong>{{ formatCurrency(projectedContribution) }}</strong>
        </div>
        <div>
          <span>Cenário base</span>
          <strong>{{ formatCurrency(baseFinalValue) }}</strong>
        </div>
        <div>
          <span>Upside otimista</span>
          <strong class="is-positive">+ {{ formatCurrency(optimisticDelta) }}</strong>
        </div>
        <div v-if="nearestGoal">
          <span>Próxima meta</span>
          <strong>{{ nearestGoal.label }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.net-worth-timeline {
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.net-worth-timeline__header,
.net-worth-timeline__body,
.net-worth-timeline__horizons,
.net-worth-timeline__aside {
  display: flex;
  gap: var(--space-4);
}

.net-worth-timeline__header {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.net-worth-timeline__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.net-worth-timeline h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

.net-worth-timeline__header span {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.net-worth-timeline__horizons {
  align-items: center;
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-xs);
  padding: var(--space-1);
  background: var(--color-bg-elevated);
}

.net-worth-timeline__horizons button {
  min-height: 30px;
  border: 0;
  border-radius: var(--radius-xs);
  padding: 0 var(--space-3);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
}

.net-worth-timeline__horizons button.is-active {
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  color: var(--color-brand-500);
}

.net-worth-timeline__body {
  align-items: stretch;
}

.net-worth-timeline__body > :first-child {
  min-width: 0;
  flex: 1;
}

.net-worth-timeline__aside {
  width: min(280px, 34%);
  flex-direction: column;
}

.net-worth-timeline__aside div {
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-xs);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
}

.net-worth-timeline__aside span {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.net-worth-timeline__aside strong {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
}

.net-worth-timeline__aside .is-positive {
  color: var(--color-positive);
}

@media (max-width: 900px) {
  .net-worth-timeline__header,
  .net-worth-timeline__body {
    flex-direction: column;
  }

  .net-worth-timeline__aside {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .net-worth-timeline {
    padding: var(--space-4);
  }

  .net-worth-timeline__horizons {
    width: 100%;
  }

  .net-worth-timeline__horizons button {
    flex: 1;
  }

  .net-worth-timeline__aside {
    grid-template-columns: 1fr;
  }
}
</style>
