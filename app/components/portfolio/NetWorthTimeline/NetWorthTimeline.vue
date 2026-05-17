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

const scenarioColors: Record<NetWorthScenarioId, string> = {
  optimistic: "#42e8a9",
  base: "#44d4ff",
  pessimistic: "#ffb45c",
};

const chartOption = computed<EChartsOption>(() => {
  const markPointData = projection.value.goalMarkers.map((marker) => ({
    name: marker.label,
    coord: [marker.monthOffset, marker.value],
    value: marker.label,
  }));

  return {
    backgroundColor: "transparent",
    color: ["#8da2bf", scenarioColors.optimistic, scenarioColors.base, scenarioColors.pessimistic],
    grid: { top: 36, right: 20, bottom: 34, left: 64 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(11, 18, 32, 0.96)",
      borderColor: "rgba(68, 212, 255, 0.24)",
      textStyle: { color: "#f8fbff" },
      valueFormatter: (value): string => typeof value === "number" ? formatCurrency(value) : "-",
    },
    legend: {
      top: 0,
      right: 0,
      itemGap: 12,
      textStyle: { color: "#8da2bf" },
    },
    xAxis: {
      type: "value",
      min: -12,
      max: horizonMonths.value,
      boundaryGap: [0, 0],
      axisLine: { lineStyle: { color: "rgba(141, 162, 191, 0.22)" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#8da2bf",
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
      splitLine: { lineStyle: { color: "rgba(141, 162, 191, 0.12)" } },
      axisLabel: {
        color: "#8da2bf",
        formatter: (value: number): string => `${Math.round(value / 1000)}k`,
      },
    },
    series: [
      {
        name: "Patrimônio real",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3, type: "solid" },
        areaStyle: { color: "rgba(141, 162, 191, 0.08)" },
        data: projection.value.actualSeries.map((point) => [point.monthOffset, point.value]),
      },
      ...NET_WORTH_SCENARIOS.map((scenario) => ({
        name: `Cenário ${scenario.label.toLowerCase()}`,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: scenario.id === "base" ? 3 : 2, type: "dashed" },
        itemStyle: { color: scenarioColors[scenario.id] },
        data: projection.value.projectedSeries[scenario.id].map((point) => [point.monthOffset, point.value]),
        markPoint: scenario.id === "base" && markPointData.length > 0
          ? {
              symbol: "pin",
              symbolSize: 42,
              label: { color: "#07101b", formatter: "Meta" },
              itemStyle: { color: "#44d4ff" },
              data: markPointData,
            }
          : undefined,
      })),
    ],
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
  border: 1px solid rgba(130, 157, 198, 0.22);
  border-radius: var(--radius-lg);
  padding: 24px;
  background: #151f31;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.net-worth-timeline__header,
.net-worth-timeline__body,
.net-worth-timeline__horizons,
.net-worth-timeline__aside {
  display: flex;
  gap: 18px;
}

.net-worth-timeline__header {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}

.net-worth-timeline__eyebrow {
  margin: 0 0 8px;
  color: #44d4ff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.net-worth-timeline h2 {
  margin: 0;
  color: #f7fbff;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

.net-worth-timeline__header span {
  display: block;
  margin-top: 6px;
  color: #8da2bf;
  font-size: var(--font-size-sm);
}

.net-worth-timeline__horizons {
  align-items: center;
  border: 1px solid rgba(130, 157, 198, 0.22);
  border-radius: var(--radius-xs);
  padding: 4px;
  background: rgba(10, 16, 29, 0.44);
}

.net-worth-timeline__horizons button {
  min-height: 30px;
  border: 0;
  border-radius: var(--radius-xs);
  padding: 0 12px;
  background: transparent;
  color: #8da2bf;
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
}

.net-worth-timeline__horizons button.is-active {
  background: rgba(68, 212, 255, 0.12);
  color: #44d4ff;
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
  border: 1px solid rgba(130, 157, 198, 0.18);
  border-radius: var(--radius-xs);
  padding: 14px;
  background: rgba(10, 16, 29, 0.34);
}

.net-worth-timeline__aside span {
  display: block;
  color: #8da2bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.net-worth-timeline__aside strong {
  display: block;
  margin-top: 6px;
  color: #f7fbff;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-lg);
}

.net-worth-timeline__aside .is-positive {
  color: #42e8a9;
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
    padding: 18px;
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
