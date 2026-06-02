<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NAlert, NButton, NSelect, NSlider, NStatistic, useMessage } from "naive-ui";
import type { EChartsOption } from "echarts";

import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { useGoalProjectionQuery } from "~/features/goals/queries/use-goal-projection-query";
import { useUpdateGoalMutation } from "~/features/goals/queries/use-update-goal-mutation";
import { projectGoalScenario, projectedCompletionDate } from "~/features/goals/utils/goal-projection";
import { useSimulationQuota } from "~/features/simulations/composables/useSimulationQuota";
import SimulatorPaywallOverlay from "~/features/simulations/components/SimulatorPaywallOverlay.vue";
import SaveSimulationButton from "~/components/simulation/SaveSimulationButton.vue";
import {
  addPinnedScenario,
  canPinScenario,
  removePinnedScenario,
  type PinnedScenario,
} from "~/features/goals/utils/simulation-scenarios";
import { formatCurrency } from "~/utils/currency";
import UiChart from "~/components/ui/UiChart.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Simulador de meta",
  pageSubtitle: "Ajuste aportes e prazos para planejar cenários",
});

const route = useRoute();
const toast = useMessage();

const goalId = computed<string>(() => String(route.params.id ?? ""));
const goalIdRef = computed<string | null>(() => goalId.value || null);

const goalsQuery = useGoalsQuery();
const projectionQuery = useGoalProjectionQuery(goalIdRef);
const updateMutation = useUpdateGoalMutation();

const goal = computed(() => goalsQuery.data.value?.find((g) => g.id === goalId.value) ?? null);

const baselineMonthly = computed<number>(() => {
  const proj = projectionQuery.data.value?.projection;
  if (!proj) { return 0; }
  const parsed = parseFloat(proj.monthly_contribution);
  return Number.isFinite(parsed) ? parsed : 0;
});

const baselineAnnualRatePct = computed<number>(() => {
  const proj = projectionQuery.data.value?.projection;
  if (!proj) { return 8; }
  const parsed = parseFloat(proj.portfolio_annual_return_rate_pct);
  return Number.isFinite(parsed) ? parsed : 8;
});

const monthlyContribution = ref<number>(0);
const horizonMonths = ref<number>(24);
const annualRatePct = ref<number>(8);
const initialised = ref<boolean>(false);

watch(
  [baselineMonthly, baselineAnnualRatePct, goal],
  ([m, r, g]) => {
    if (initialised.value || !g) { return; }
    monthlyContribution.value = m > 0 ? m : 200;
    annualRatePct.value = r;
    const deadline = g.target_date ? new Date(g.target_date) : null;
    if (deadline) {
      const now = new Date();
      const diff = Math.max(
        6,
        (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()),
      );
      horizonMonths.value = Math.min(360, diff);
    }
    initialised.value = true;
  },
  { immediate: true },
);

const baselineScenario = computed(() => {
  if (!goal.value) { return null; }
  return projectGoalScenario({
    currentAmount: goal.value.current_amount,
    targetAmount: goal.value.target_amount,
    monthlyContribution: baselineMonthly.value,
    annualReturnRatePct: baselineAnnualRatePct.value,
    horizonMonths: horizonMonths.value,
  });
});

const adjustedScenario = computed(() => {
  if (!goal.value) { return null; }
  return projectGoalScenario({
    currentAmount: goal.value.current_amount,
    targetAmount: goal.value.target_amount,
    monthlyContribution: monthlyContribution.value,
    annualReturnRatePct: annualRatePct.value,
    horizonMonths: horizonMonths.value,
  });
});

// ── Comparação de até 3 cenários (PROD-02 / #536) ────────────────────────
const comparisons = ref<PinnedScenario[]>([]);
let scenarioCounter = 0;

const canPin = computed<boolean>(() => canPinScenario(comparisons.value));

/**
 *
 */
const pinCurrentScenario = (): void => {
  const scenario = adjustedScenario.value;
  if (!scenario || !canPin.value) { return; }
  scenarioCounter += 1;
  comparisons.value = addPinnedScenario(comparisons.value, {
    id: `s${scenarioCounter}`,
    label: `${formatCurrency(monthlyContribution.value)}/mês · ${horizonMonths.value}m · ${annualRatePct.value.toFixed(1)}%`,
    monthlyContribution: monthlyContribution.value,
    annualRatePct: annualRatePct.value,
    horizonMonths: horizonMonths.value,
    points: scenario.points.map((p) => Number(p.balance.toFixed(2))),
  });
};

/**
 *
 * @param id
 */
const removeComparison = (id: string): void => {
  comparisons.value = removePinnedScenario(comparisons.value, id);
};

// ── Salvar simulação como rascunho (PROD-02 / #536) ──────────────────────
const saveInputs = computed<Record<string, unknown>>(() => ({
  goal_id: goalId.value,
  monthly_contribution: monthlyContribution.value,
  annual_rate_pct: annualRatePct.value,
  horizon_months: horizonMonths.value,
}));

const saveResult = computed<Record<string, unknown>>(() => ({
  final_balance: adjustedScenario.value?.finalBalance ?? 0,
  remaining_gap: adjustedScenario.value?.remainingGap ?? 0,
  months_to_target: adjustedScenario.value?.monthsToTarget ?? null,
  projected_completion: adjustedCompletion.value,
}));

const chartOption = computed<EChartsOption>(() => {
  const baseline = baselineScenario.value;
  const adjusted = adjustedScenario.value;
  const target = goal.value?.target_amount ?? 0;
  const xAxis = Array.from({ length: horizonMonths.value }, (_, i) => i + 1);
  return {
    grid: { left: 56, right: 24, top: 32, bottom: 32 },
    xAxis: {
      type: "category",
      data: xAxis.map((m) => `M${m}`),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number): string => formatCurrency(value).replace(/\s/g, ""),
      },
    },
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    series: [
      {
        name: "Aporte atual",
        type: "line",
        showSymbol: false,
        data: baseline?.points.map((p) => Number(p.balance.toFixed(2))) ?? [],
        lineStyle: { type: "dashed" },
        markLine: {
          symbol: "none",
          data: [{ yAxis: target, label: { formatter: "Objetivo" } }],
        },
      },
      {
        name: "Aporte ajustado",
        type: "line",
        showSymbol: false,
        data: adjusted?.points.map((p) => Number(p.balance.toFixed(2))) ?? [],
      },
      ...comparisons.value.map((scenario) => ({
        name: scenario.label,
        type: "line" as const,
        showSymbol: false,
        data: [...scenario.points],
      })),
    ],
  };
});

const isLoading = computed<boolean>(
  () => goalsQuery.isLoading.value || projectionQuery.isLoading.value,
);

const isError = computed<boolean>(
  () => goalsQuery.isError.value || projectionQuery.isError.value,
);

const goalNotFound = computed<boolean>(
  () => !isLoading.value && goalsQuery.data.value !== undefined && goal.value === null,
);

const adjustedCompletion = computed<string | null>(() => {
  const scenario = adjustedScenario.value;
  if (!scenario) { return null; }
  return projectedCompletionDate(scenario.monthsToTarget);
});

const baselineCompletion = computed<string | null>(() => {
  const scenario = baselineScenario.value;
  if (!scenario) { return null; }
  return projectedCompletionDate(scenario.monthsToTarget);
});

const canApply = computed<boolean>(() =>
  !!goal.value
  && monthlyContribution.value > 0
  && adjustedCompletion.value !== null
  && !updateMutation.isPending.value,
);

/**
 * Persists the adjusted scenario as the goal's new target_date.
 *
 * We store the scenario's projected_completion_date as the new target_date —
 * the monthly contribution itself is computed server-side from the portfolio
 * once the goal is saved.
 */
const applyScenario = async (): Promise<void> => {
  if (!canApply.value || !goal.value) { return; }
  const nextDate = adjustedCompletion.value;
  if (!nextDate) { return; }
  try {
    await updateMutation.mutateAsync({ id: goal.value.id, target_date: nextDate });
    toast.success("Cenário aplicado à meta.");
    await navigateTo("/goals");
  }
  catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao aplicar cenário.";
    toast.error(message);
  }
};

/**
 * Formats an ISO date (YYYY-MM-DD) as a pt-BR "MMM/YYYY" label, or returns a
 * dash when the date is null (unreachable scenario).
 *
 * @param value - ISO date string or null.
 * @returns Display-friendly completion label.
 */
const formatCompletion = (value: string | null): string => {
  if (!value) { return "—"; }
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(date);
};

// ── Gate freemium + selector de meta (#566) ──────────────────────────────
const { quota, unlimited, consume } = useSimulationQuota();

const goalOptions = computed(() =>
  (goalsQuery.data.value ?? [])
    .slice()
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 10)
    .map((g) => ({ label: g.name, value: g.id })),
);

/**
 *
 * @param value
 */
const onSelectGoal = (value: string): void => {
  if (value && value !== goalId.value) {
    void navigateTo(`/goals/${value}/simulate`);
  }
};

const hasConsumed = ref<boolean>(false);
const simulatorLocked = ref<boolean>(false);

/**
 * Consome a quota na primeira interação real do usuário com os sliders (a
 * "simulação E se?"). Free esgotado → trava o resultado e exibe o paywall.
 * Premium nunca consome nem trava.
 */
const onUserAdjust = (): void => {
  if (hasConsumed.value || unlimited.value || !goalId.value) { return; }
  hasConsumed.value = true;
  void consume(goalId.value).then((result) => {
    simulatorLocked.value = !result.allowed;
  });
};

/**
 *
 */
const goToUpgrade = (): void => {
  void navigateTo("/subscription");
};
</script>

<template>
  <div class="goal-sandbox">
    <NAlert v-if="isError" type="error" title="Não foi possível carregar a meta" />
    <div v-else-if="isLoading" class="goal-sandbox__loading">
      <BaseSkeleton height="80px" />
      <BaseSkeleton height="320px" />
    </div>
    <NAlert v-else-if="goalNotFound" type="warning" title="Meta não encontrada" />
    <template v-else-if="goal">
      <UiSurfaceCard class="goal-sandbox__header">
        <header class="goal-sandbox__title-block">
          <h1 class="goal-sandbox__title">{{ goal.name }}</h1>
          <p class="goal-sandbox__subtitle">
            {{ formatCurrency(goal.current_amount) }} de {{ formatCurrency(goal.target_amount) }}
          </p>
        </header>
        <NSelect
          v-if="goalOptions.length > 1"
          :value="goalId"
          :options="goalOptions"
          data-testid="goal-selector"
          class="goal-sandbox__selector"
          @update:value="onSelectGoal"
        />
      </UiSurfaceCard>

      <section class="goal-sandbox__grid">
        <UiSurfaceCard class="goal-sandbox__controls">
          <h2 class="goal-sandbox__section-title">Parâmetros</h2>
          <div class="goal-sandbox__field">
            <div class="goal-sandbox__field-label">
              <span>Aporte mensal</span>
              <strong>{{ formatCurrency(monthlyContribution) }}</strong>
            </div>
            <NSlider
              v-model:value="monthlyContribution"
              :min="0"
              :max="Math.max(5000, Math.ceil((baselineMonthly || 500) * 4))"
              :step="50"
              @update:value="onUserAdjust"
            />
          </div>

          <div class="goal-sandbox__field">
            <div class="goal-sandbox__field-label">
              <span>Prazo (meses)</span>
              <strong>{{ horizonMonths }}</strong>
            </div>
            <NSlider v-model:value="horizonMonths" :min="6" :max="240" :step="1" @update:value="onUserAdjust" />
          </div>

          <div class="goal-sandbox__field">
            <div class="goal-sandbox__field-label">
              <span>Rendimento anual esperado</span>
              <strong>{{ annualRatePct.toFixed(2) }}%</strong>
            </div>
            <NSlider v-model:value="annualRatePct" :min="0" :max="25" :step="0.25" @update:value="onUserAdjust" />
          </div>
        </UiSurfaceCard>

        <UiSurfaceCard class="goal-sandbox__indicators">
          <div :class="{ 'goal-sandbox__blurred': simulatorLocked }">
            <h2 class="goal-sandbox__section-title">Indicadores</h2>
            <div class="goal-sandbox__stats">
              <NStatistic label="Valor projetado">
                {{ formatCurrency(adjustedScenario?.finalBalance ?? 0) }}
              </NStatistic>
              <NStatistic label="Gap restante">
                {{ formatCurrency(adjustedScenario?.remainingGap ?? 0) }}
              </NStatistic>
              <NStatistic label="Conclusão estimada">
                {{ formatCompletion(adjustedCompletion) }}
              </NStatistic>
            </div>
            <p v-if="adjustedScenario && adjustedScenario.monthsToTarget === null" class="goal-sandbox__warning">
              Nesse cenário, a meta não é atingida dentro do prazo selecionado. Aumente o aporte ou o horizonte.
            </p>
          </div>
          <SimulatorPaywallOverlay
            v-if="simulatorLocked"
            :reset-at="quota.resetAt"
            @upgrade="goToUpgrade"
          />
        </UiSurfaceCard>
      </section>

      <UiSurfaceCard class="goal-sandbox__chart">
        <div class="goal-sandbox__chart-head">
          <h2 class="goal-sandbox__section-title">Projeção ao longo do tempo</h2>
          <NButton
            size="small"
            :disabled="!canPin || !adjustedScenario"
            data-testid="pin-scenario"
            @click="pinCurrentScenario"
          >
            Adicionar à comparação
          </NButton>
        </div>
        <UiChart
          :option="chartOption"
          :update-key="`${horizonMonths}-${monthlyContribution}-${annualRatePct}-${comparisons.length}`"
          height="340px"
        />
        <ul class="goal-sandbox__legend">
          <li>
            <span class="goal-sandbox__legend-dot goal-sandbox__legend-dot--baseline" />
            Aporte atual ({{ formatCurrency(baselineMonthly) }} · {{ formatCompletion(baselineCompletion) }})
          </li>
          <li>
            <span class="goal-sandbox__legend-dot goal-sandbox__legend-dot--adjusted" />
            Aporte ajustado ({{ formatCurrency(monthlyContribution) }} · {{ formatCompletion(adjustedCompletion) }})
          </li>
        </ul>

        <div v-if="comparisons.length" class="goal-sandbox__comparisons" data-testid="comparisons">
          <span class="goal-sandbox__comparisons-title">Cenários comparados ({{ comparisons.length }}/3)</span>
          <ul>
            <li v-for="scenario in comparisons" :key="scenario.id">
              <span>{{ scenario.label }}</span>
              <NButton text size="tiny" :data-testid="`remove-${scenario.id}`" @click="removeComparison(scenario.id)">✕</NButton>
            </li>
          </ul>
        </div>
      </UiSurfaceCard>

      <div class="goal-sandbox__actions">
        <NButton secondary @click="navigateTo('/goals')">Cancelar</NButton>
        <SaveSimulationButton
          tool-id="goal-simulator"
          rule-version="2026.06"
          :inputs="saveInputs"
          :result="saveResult"
          label="Salvar como rascunho"
        />
        <NButton type="primary" :loading="updateMutation.isPending.value" :disabled="!canApply" @click="applyScenario">
          Aplicar este cenário
        </NButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.goal-sandbox {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
}

.goal-sandbox__loading {
  display: grid;
  gap: var(--space-2);
}

.goal-sandbox__header { padding: var(--space-3); }
.goal-sandbox__title { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.goal-sandbox__subtitle { margin: var(--space-1) 0 0; color: var(--color-text-muted); }

.goal-sandbox__grid {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 1fr 1fr;
}

.goal-sandbox__section-title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.goal-sandbox__field {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.goal-sandbox__field-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.goal-sandbox__field-label strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.goal-sandbox__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.goal-sandbox__warning {
  margin: var(--space-2) 0 0;
  color: var(--color-warning);
  font-size: var(--font-size-sm);
}

.goal-sandbox__indicators { position: relative; }

.goal-sandbox__blurred {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
}

.goal-sandbox__selector { margin-top: var(--space-2); max-width: 18rem; }

.goal-sandbox__chart { display: grid; gap: var(--space-2); }

.goal-sandbox__chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.goal-sandbox__comparisons {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
}

.goal-sandbox__comparisons-title {
  font-weight: var(--font-weight-medium);
  opacity: 0.8;
}

.goal-sandbox__comparisons ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.goal-sandbox__comparisons li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.goal-sandbox__legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.goal-sandbox__legend li { display: flex; align-items: center; gap: var(--space-1); }

.goal-sandbox__legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}

.goal-sandbox__legend-dot--baseline { background: var(--color-text-muted); }
.goal-sandbox__legend-dot--adjusted { background: var(--color-brand); }

.goal-sandbox__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 768px) {
  .goal-sandbox__grid { grid-template-columns: 1fr; }
  .goal-sandbox__stats { grid-template-columns: 1fr; }
}
</style>
