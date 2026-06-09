<script setup lang="ts">
import type { EChartsOption } from "echarts";
import {
  ArrowDownAZ,
  ArrowUpRight,
  Bolt,
  Download,
  Filter,
  MoreVertical,
  Plus,
  SlidersHorizontal,
} from "lucide-vue-next";
import { NButton } from "naive-ui";

import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useUpdateGoalMutation } from "~/features/goals/queries/use-update-goal-mutation";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import GoalContributionModal from "~/components/goal/GoalContributionModal/GoalContributionModal.vue";
import type { GoalDto, GoalStatus, CreateGoalPayload } from "~/features/goals/contracts/goal.dto";
import { formatCurrency } from "~/utils/currency";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";
import { useTheme } from "~/composables/useTheme";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Metas",
  pageSubtitle: "Objetivos e progresso.",
});

useHead({ title: "Metas Financeiras | Auraxis" });

type FilterValue = "all" | GoalStatus;
type GoalTone = "lime" | "orange" | "red" | "cyan";

interface GoalViewModel extends GoalDto {
  readonly progress: number;
  readonly targetLabel: string;
  readonly currentLabel: string;
  readonly deadlineLabel: string;
  readonly healthLabel: string;
  readonly tone: GoalTone;
  readonly monthlyContribution: number;
  readonly monthlyDelta: string;
}

interface ActionHighlight {
  readonly tone: "orange" | "lime" | "neutral";
  readonly badge: string;
  readonly title: string;
  readonly description: string;
  readonly action: string;
}

const { data: goals, isLoading, isError } = useGoalsQuery();
const createMutation = useCreateGoalMutation();
const updateMutation = useUpdateGoalMutation();
const { resolvedTheme } = useTheme();

const activeFilter = ref<FilterValue>("all");
const showForm = ref<boolean>(false);
const editingGoal = ref<GoalDto | null>(null);
const contributionTarget = ref<GoalViewModel | null>(null);
const isContributionModalOpen = ref<boolean>(false);
const selectedGoalId = ref<string>("");
const simulatedContribution = ref<number>(2500);
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const filterOptions = computed((): Array<{ value: FilterValue; label: string }> => [
  { value: "all", label: "Todas" },
  { value: "active", label: t("pages.goals.filters.active") },
  { value: "completed", label: t("pages.goals.filters.completed") },
  { value: "paused", label: t("pages.goals.filters.paused") },
]);

const allGoals = computed(() => goals.value ?? []);

const filteredGoals = computed(() => {
  if (activeFilter.value === "all") {
    return allGoals.value;
  }

  return allGoals.value.filter((goal) => goal.status === activeFilter.value);
});

/**
 * Opens the form in create mode.
 */
const onNewGoal = (): void => {
  editingGoal.value = null;
  showForm.value = true;
};

/**
 * Handles form submission for both create and edit flows.
 *
 * @param payload Form payload emitted by GoalForm.
 */
const onCreateOrUpdate = (payload: CreateGoalPayload): void => {
  if (editingGoal.value) {
    updateMutation.mutate(
      { id: editingGoal.value.id, ...payload },
      {
        onSuccess: (): void => {
          showForm.value = false;
          editingGoal.value = null;
        },
      },
    );
    return;
  }

  createMutation.mutate(payload, {
    onSuccess: (): void => {
      showForm.value = false;
    },
  });
};

/**
 * Formats date labels in the same compact style used by the prototype.
 *
 * @param value ISO date string.
 * @returns Localized month/year label.
 */
function formatDeadline(value: string | null | undefined): string {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

/**
 * Calculates a clamped progress percentage for a goal.
 *
 * @param goal Goal data.
 * @returns Integer percentage between 0 and 100.
 */
function calculateProgress(goal: GoalDto): number {
  if (goal.target_amount <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((goal.current_amount / goal.target_amount) * 100)));
}

/**
 * Detects goals that reached the target but were not explicitly closed yet.
 *
 * @param goal Goal data.
 * @returns True when the user should see the completion CTA.
 */
function isGoalReached(goal: GoalDto): boolean {
  return goal.status !== "completed" && goal.target_amount > 0 && goal.current_amount >= goal.target_amount;
}

/**
 * Resolves the Market Pulse status tone used by goal cards.
 *
 * @param goal Goal data.
 * @param progress Goal progress percentage.
 * @returns Tone and label for the status badge.
 */
function resolveHealth(goal: GoalDto, progress: number): Pick<GoalViewModel, "healthLabel" | "tone"> {
  if (goal.status === "completed") {
    return { healthLabel: "Concluída", tone: "cyan" };
  }

  if (progress >= 100) {
    return { healthLabel: "Meta alcançada", tone: "cyan" };
  }

  if (goal.status === "paused" || progress < 50) {
    return { healthLabel: "Em risco", tone: "orange" };
  }

  const deadline = goal.target_date ? new Date(`${goal.target_date}T00:00:00`) : null;
  if (deadline && deadline.getTime() < Date.now() && progress < 100) {
    return { healthLabel: "Atrasada", tone: "red" };
  }

  return { healthLabel: "Em dia", tone: "lime" };
}

/**
 * Resolves the support label shown below the progress bar.
 *
 * @param goal Goal data.
 * @param tone Market Pulse status tone.
 * @param monthlyContribution Current monthly contribution.
 * @returns Monthly delta label.
 */
function resolveMonthlyDelta(goal: GoalDto, tone: GoalTone, monthlyContribution: number): string {
  if (tone === "orange") {
    return "-R$ 350 defasagem";
  }

  if (tone === "red") {
    return `Faltam ${formatCurrency(Math.max(goal.target_amount - goal.current_amount, 0))}`;
  }

  return `+${formatCurrency(monthlyContribution * 0.8)} este mês`;
}

/**
 * Builds the visual model consumed by cards, charts and simulator.
 *
 * @param goal Goal data.
 * @param index Goal index used for deterministic fallback values.
 * @returns Goal view model.
 */
function toGoalViewModel(goal: GoalDto, index: number): GoalViewModel {
  const progress = calculateProgress(goal);
  const health = resolveHealth(goal, progress);
  const monthlyContribution = [1500, 2000, 500, 1200][index] ?? 1000;
  const monthlyDelta = resolveMonthlyDelta(goal, health.tone, monthlyContribution);

  return {
    ...goal,
    progress,
    targetLabel: formatCurrency(goal.target_amount),
    currentLabel: formatCurrency(goal.current_amount),
    deadlineLabel: formatDeadline(goal.target_date),
    monthlyContribution,
    monthlyDelta,
    ...health,
  };
}

const goalCards = computed(() => filteredGoals.value.map(toGoalViewModel));

const selectedGoal = computed(() => {
  return goalCards.value.find((goal) => goal.id === selectedGoalId.value) ?? goalCards.value[0] ?? null;
});

/**
 * Opens the dedicated detail route for a selected goal card.
 *
 * @param goal Goal selected in the status grid.
 */
const openGoalDetails = (goal: GoalViewModel): void => {
  void navigateTo(`/goals/${goal.id}`);
};

/**
 * Opens the contribution modal for the selected goal.
 *
 * @param goal Goal selected in the status grid.
 */
const onRegisterContribution = (goal: GoalViewModel): void => {
  contributionTarget.value = goal;
  isContributionModalOpen.value = true;
};

/**
 * Explicitly closes a reached goal after the user confirms the intent via CTA.
 *
 * @param goal Goal selected in the status grid.
 */
const onConcludeGoal = (goal: GoalViewModel): void => {
  updateMutation.mutate({ id: goal.id, status: "completed" });
};

watch(isContributionModalOpen, (visible) => {
  if (!visible) {
    contributionTarget.value = null;
  }
});

watch(
  goalCards,
  (items) => {
    if (items.length > 0 && !items.some((goal) => goal.id === selectedGoalId.value)) {
      selectedGoalId.value = items[0]?.id ?? "";
    }
  },
  { immediate: true },
);

const actionHighlights = computed<ActionHighlight[]>(() => {
  const [firstGoal, secondGoal] = goalCards.value;
  if (!firstGoal) {
    return [];
  }

  return [
    {
      tone: firstGoal.tone === "orange" || firstGoal.tone === "red" ? "orange" : "lime",
      badge: firstGoal.tone === "orange" || firstGoal.tone === "red" ? "Atenção" : "Próximo passo",
      title: `Revisar ritmo: ${firstGoal.name}`,
      description: `Você já acumulou ${firstGoal.currentLabel} de ${firstGoal.targetLabel}. Ajuste o aporte ou o prazo para manter essa meta compatível com sua rotina.`,
      action: "Simular ajuste",
    },
    {
      tone: "neutral",
      badge: "Organização",
      title: secondGoal ? `Comparar prioridade: ${secondGoal.name}` : "Crie uma segunda meta para comparar prioridades",
      description: secondGoal
        ? "Compare prazo, esforço mensal e impacto no caixa antes de decidir qual objetivo acelerar."
        : "Com mais de uma meta, o Auraxis ajuda você a enxergar qual objetivo pede atenção primeiro.",
      action: secondGoal ? "Comparar metas" : "Criar outra meta",
    },
  ];
});

const timelineChartOption = computed<EChartsOption>(() => {
  const tokens = chartTokens.value;
  const labels = ["Hoje", "6m", "12m", "18m", "24m", "30m", "36m"];
  const invested = labels.map((_, index) =>
    Math.round(goalCards.value.reduce((sum, goal) => sum + goal.current_amount + goal.monthlyContribution * index * 6, 0)),
  );
  const projected = invested.map((value, index) => Math.round(value * (1 + index * 0.042)));

  return {
    backgroundColor: "transparent",
    color: [tokens.balance, tokens.income],
    grid: { top: 24, right: 22, bottom: 32, left: 60 },
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.tooltipBackground,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
      valueFormatter: (value): string => formatCurrency(Number(value)),
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.mutedText },
    },
    media: [
      {
        query: { maxWidth: 520 },
        option: {
          grid: { top: 56, right: 10, bottom: 28, left: 44 },
          legend: {
            top: 0,
            left: 0,
            right: "auto",
            itemGap: 8,
            itemHeight: 6,
            itemWidth: 10,
            textStyle: { color: tokens.mutedText, fontSize: 10 },
          },
        },
      },
    ],
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
      axisLabel: { color: tokens.mutedText },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: tokens.grid } },
      axisLabel: {
        color: tokens.mutedText,
        formatter: (value: number): string => `${Math.round(value / 1000)}k`,
      },
    },
    series: [
      {
        name: "Aportes",
        type: "line",
        smooth: true,
        data: invested,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 3 },
      },
      {
        name: "Projeção Total",
        type: "line",
        smooth: true,
        data: projected,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 3 },
        areaStyle: { color: withAlpha(tokens.income, resolvedTheme.value === "dark" ? 0.08 : 0.14) },
      },
    ],
  };
});

const simulatedImpact = computed(() => {
  const goal = selectedGoal.value;
  if (!goal) {
    return {
      newDeadline: "Sem meta",
      savedTime: "0 meses",
      extraYield: formatCurrency(0),
    };
  }

  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
  const baseMonths = Math.max(1, Math.ceil(remaining / Math.max(goal.monthlyContribution, 1)));
  const simulatedMonths = Math.max(1, Math.ceil(remaining / simulatedContribution.value));
  const savedMonths = Math.max(0, baseMonths - simulatedMonths);
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + simulatedMonths);

  return {
    newDeadline: formatDeadline(projectedDate.toISOString().slice(0, 10)),
    savedTime: `${savedMonths} meses`,
    extraYield: `+ ${formatCurrency(savedMonths * 368)}`,
  };
});
</script>

<template>
  <div class="goals-market-pulse">
    <section class="goals-market-pulse__header" aria-label="Cabeçalho de metas">
      <div>
        <h1>Metas Financeiras</h1>
        <p>Acompanhe e simule o progresso dos seus objetivos de longo prazo.</p>
      </div>

      <div class="goals-market-pulse__actions">
        <button class="mp-button mp-button--secondary" type="button">
          <Download :size="16" aria-hidden="true" />
          Relatório
        </button>
        <NButton class="mp-button mp-button--primary" type="primary" @click="onNewGoal">
          <template #icon>
            <Plus :size="16" aria-hidden="true" />
          </template>
          Nova Meta
        </NButton>
      </div>
    </section>

    <UiInlineError
      v-if="isError"
      :title="$t('pages.goals.loadError')"
      :message="$t('pages.goals.loadErrorMessage')"
    />

    <UiPageLoader v-else-if="isLoading" :rows="4" :with-title="true" />

    <template v-else>
      <AiInsightSurface dimension="goals" />

      <section v-if="goalCards.length === 0" class="goals-empty-state" aria-label="Metas vazias">
        <UiEmptyState
          icon="target"
          title="Suas metas começam aqui"
          description="Metas transformam desejos em um plano acompanhável: você define o valor alvo, informa quanto já guardou e escolhe um prazo. A partir daí o Auraxis calcula progresso, ritmo de aporte e sinais de atenção."
          action-label="Criar primeira meta"
          secondary-label="Entender simulações"
          secondary-href="/simulations"
          @action="onNewGoal"
        >
          <template #illustration>
            <IllustrationEmptyGoals class="ui-empty-state__illustration-svg" />
          </template>
        </UiEmptyState>
      </section>

      <section v-else id="action-highlights" class="mp-panel action-highlights">
        <div class="section-title">
          <span class="section-icon section-icon--cyan">
            <Bolt :size="17" aria-hidden="true" />
          </span>
          <h2>O que fazer agora</h2>
        </div>

        <div class="action-grid">
          <article
            v-for="item in actionHighlights"
            :key="item.title"
            class="action-card"
            :class="`action-card--${item.tone}`"
          >
            <div class="action-card__topline">
              <span>{{ item.badge }}</span>
              <ArrowUpRight :size="16" aria-hidden="true" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <button type="button">{{ item.action }}</button>
          </article>
        </div>
      </section>

      <section v-if="goalCards.length > 0" id="goals-status" class="goals-status">
        <div class="section-toolbar">
          <h2>Status das Metas</h2>
          <div class="toolbar-actions">
            <div class="filter-tabs" aria-label="Filtro de metas">
              <button
                v-for="option in filterOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-active': activeFilter === option.value }"
                @click="activeFilter = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <button class="icon-button" type="button" aria-label="Filtrar metas">
              <Filter :size="16" aria-hidden="true" />
            </button>
            <button class="icon-button" type="button" aria-label="Ordenar metas">
              <ArrowDownAZ :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="goal-card-grid">
          <article
            v-for="goal in goalCards"
            :key="goal.id"
            class="goal-status-card"
            :class="`goal-status-card--${goal.tone}`"
            @click="selectedGoalId = goal.id"
          >
            <div class="goal-status-card__glow" aria-hidden="true" />
            <div class="goal-status-card__header">
              <div>
                <h3>{{ goal.name }}</h3>
                <p>Prazo: {{ goal.deadlineLabel }}</p>
              </div>
              <span class="status-badge">
                <i aria-hidden="true" />
                {{ goal.healthLabel }}
              </span>
            </div>

            <div class="goal-progress">
              <div class="goal-progress__amounts">
                <strong>{{ goal.currentLabel }}</strong>
                <span>de {{ goal.targetLabel }}</span>
              </div>
              <div class="progress-track" aria-hidden="true">
                <span :style="{ width: `${goal.progress}%` }" />
              </div>
              <div class="goal-progress__footer">
                <span>{{ goal.progress }}% concluído</span>
                <strong>{{ goal.monthlyDelta }}</strong>
              </div>
            </div>

            <div
              v-if="isGoalReached(goal)"
              class="goal-status-card__completion"
              aria-label="Meta alcançada"
            >
              <strong>Meta alcançada</strong>
              <span>Revise o objetivo e conclua quando estiver pronto.</span>
            </div>

            <div class="goal-status-card__footer">
              <span>
                Aporte mensal atual:
                <strong>{{ formatCurrency(goal.monthlyContribution) }}</strong>
              </span>
              <div class="goal-status-card__footer-actions">
                <button
                  v-if="isGoalReached(goal)"
                  class="goal-status-card__complete"
                  type="button"
                  :disabled="updateMutation.isPending.value"
                  @click.stop="onConcludeGoal(goal)"
                >
                  Concluir meta
                </button>
                <button
                  v-else-if="goal.status !== 'completed' && goal.status !== 'cancelled'"
                  class="goal-status-card__register"
                  type="button"
                  @click.stop="onRegisterContribution(goal)"
                >
                  Registrar entrada
                </button>
                <button
                  class="goal-status-card__details"
                  type="button"
                  @click.stop="openGoalDetails(goal)"
                >
                  <ArrowUpRight :size="15" aria-hidden="true" />
                  Ver detalhes
                </button>
                <button type="button" aria-label="Mais opções da meta" @click.stop>
                  <MoreVertical :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="goalCards.length > 0" class="goals-analytics-grid">
        <section id="goals-timeline" class="mp-panel goals-timeline">
          <div class="chart-heading">
            <div>
              <h2>Projeção de Evolução Patrimonial</h2>
              <p>Trajetória combinada de todas as metas ativas.</p>
            </div>
            <div class="range-tabs" aria-label="Intervalo da projeção">
              <button type="button">1A</button>
              <button type="button" class="is-active">3A</button>
              <button type="button">5A</button>
              <button type="button">Max</button>
            </div>
          </div>
          <UiChart :option="timelineChartOption" height="350px" />
        </section>

        <section id="contribution-simulator" class="mp-panel contribution-simulator">
          <div class="section-title section-title--bordered">
            <span class="section-icon section-icon--plain">
              <SlidersHorizontal :size="18" aria-hidden="true" />
            </span>
            <h2>Simulador de Aporte</h2>
          </div>

          <label class="field-label" for="goal-selection">Meta Selecionada</label>
          <select id="goal-selection" v-model="selectedGoalId" class="mp-select">
            <option v-for="goal in goalCards" :key="goal.id" :value="goal.id">
              Simular: {{ goal.name }}
            </option>
          </select>

          <div class="slider-block">
            <div>
              <label class="field-label" for="contribution-range">Aporte Mensal Simulado</label>
              <strong>{{ formatCurrency(simulatedContribution) }}</strong>
            </div>
            <input
              id="contribution-range"
              v-model.number="simulatedContribution"
              type="range"
              min="500"
              max="5000"
              step="100"
            >
            <div class="slider-limits">
              <span>R$ 500</span>
              <span>R$ 5.000+</span>
            </div>
          </div>

          <div class="simulation-impact">
            <h3>Impacto da Simulação</h3>
            <dl>
              <div>
                <dt>Novo Prazo Estimado</dt>
                <dd class="is-lime">{{ simulatedImpact.newDeadline }}</dd>
              </div>
              <div>
                <dt>Tempo Economizado</dt>
                <dd class="is-cyan">{{ simulatedImpact.savedTime }}</dd>
              </div>
              <div>
                <dt>Rendimento Extra</dt>
                <dd>{{ simulatedImpact.extraYield }}</dd>
              </div>
            </dl>
          </div>

          <button class="mp-button mp-button--wide" type="button">
            Aplicar Novo Aporte
          </button>
        </section>
      </div>
    </template>

    <GoalForm
      :visible="showForm"
      :goal="editingGoal"
      @update:visible="showForm = $event"
      @submit="onCreateOrUpdate"
    />
    <GoalContributionModal
      v-if="contributionTarget"
      v-model:visible="isContributionModalOpen"
      :goal="contributionTarget"
    />
  </div>
</template>

<style scoped>
.goals-market-pulse {
  --mp-surface: var(--color-bg-surface);
  --mp-surface-strong: var(--color-bg-elevated);
  --mp-border: var(--color-outline-soft);
  --mp-border-strong: var(--color-outline-hard);
  --mp-text: var(--color-text-primary);
  --mp-muted: var(--color-text-muted);
  --mp-cyan: var(--color-brand-500);
  --mp-lime: var(--color-positive);
  --mp-orange: var(--color-warning);
  --mp-red: var(--color-negative);
  --mp-brand-soft: var(--color-brand-hover-surface);
  --mp-neutral-soft: var(--color-bg-subtle);
  --mp-panel-bg:
    radial-gradient(circle at 100% 0%, var(--color-brand-glow-2xs), transparent 30%),
    var(--mp-surface);
  --mp-track: color-mix(in srgb, var(--color-text-muted) 16%, transparent);
  display: grid;
  gap: 32px;
  color: var(--mp-text);
}

.goals-market-pulse__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-block-end: 2px;
}

.goals-market-pulse__header h1,
.section-toolbar h2,
.chart-heading h2,
.section-title h2 {
  margin: 0;
  color: var(--mp-text);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

.goals-market-pulse__header p,
.chart-heading p {
  margin: 6px 0 0;
  color: var(--mp-muted);
  font-size: var(--font-size-md);
}

.goals-market-pulse__actions,
.toolbar-actions,
.filter-tabs,
.range-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mp-button,
.icon-button,
.filter-tabs button,
.range-tabs button {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  min-height: 38px;
  padding: 0 14px;
  background: var(--mp-surface);
  color: var(--mp-text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.mp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.mp-button--primary {
  border-color: var(--color-brand-glow-md);
  background: var(--mp-cyan);
  color: var(--color-text-on-brand);
  box-shadow: var(--shadow-brand-glow-sm);
}

.mp-button--secondary:hover,
.icon-button:hover,
.filter-tabs button:hover,
.range-tabs button:hover {
  border-color: var(--mp-border-strong);
  background: var(--mp-neutral-soft);
}

.mp-button--wide {
  width: 100%;
  min-height: 46px;
  margin-top: 22px;
  border-color: var(--mp-border-strong);
  background: var(--mp-surface-strong);
}

.mp-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-lg);
  background: var(--mp-panel-bg);
  box-shadow: var(--shadow-card);
}

.goals-empty-state {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-lg);
  background: var(--mp-panel-bg);
  box-shadow: var(--shadow-card);
}

.action-highlights,
.goals-timeline,
.contribution-simulator {
  padding: 24px;
}

.section-title,
.section-toolbar,
.chart-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  justify-content: flex-start;
  margin-bottom: 24px;
}

.section-title--bordered {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--mp-border);
}

.section-icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.section-icon--cyan {
  color: var(--mp-cyan);
  background: var(--mp-brand-soft);
}

.section-icon--plain {
  color: var(--mp-cyan);
}

.action-grid,
.goal-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.action-card,
.goal-status-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-md);
  background: var(--mp-surface);
  box-shadow: var(--shadow-card);
}

.action-card {
  padding: 20px;
}

.action-card__topline,
.goal-status-card__header,
.goal-status-card__footer,
.goal-progress__amounts,
.goal-progress__footer,
.slider-block > div,
.simulation-impact dl div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-card__topline span {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  background: var(--mp-neutral-soft);
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
}

.action-card--orange .action-card__topline span {
  border-color: var(--color-warning-glow);
  background: var(--color-warning-bg);
  color: var(--mp-orange);
}

.action-card--lime .action-card__topline span {
  border-color: var(--color-positive-border);
  background: var(--color-positive-bg);
  color: var(--mp-lime);
}

.action-card h3,
.goal-status-card h3,
.simulation-impact h3 {
  margin: 18px 0 8px;
  color: var(--mp-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.action-card p,
.goal-status-card p,
.simulation-impact dt,
.field-label {
  margin: 0;
  color: var(--mp-muted);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

.action-card button {
  margin-top: 18px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--mp-cyan);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-extrabold);
}

.section-toolbar {
  margin-bottom: 18px;
}

.filter-tabs {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-sm);
  padding: 4px;
  background: var(--mp-surface-strong);
}

.filter-tabs button,
.range-tabs button {
  min-height: 30px;
  border-color: transparent;
  padding: 0 10px;
  color: var(--mp-muted);
  background: transparent;
  cursor: pointer;
}

.filter-tabs button.is-active,
.range-tabs button.is-active {
  border-color: var(--mp-border-strong);
  background: var(--mp-neutral-soft);
  color: var(--mp-text);
}

.icon-button {
  width: 38px;
  padding: 0;
  color: var(--mp-muted);
  cursor: pointer;
}

.goal-status-card {
  padding: 24px;
  cursor: pointer;
}

.goal-status-card__glow {
  position: absolute;
  inset: 0 0 auto auto;
  width: 132px;
  height: 132px;
  border-bottom-left-radius: 999px;
  opacity: 0.08;
}

.goal-status-card--lime .goal-status-card__glow,
.goal-status-card--lime .progress-track span,
.goal-status-card--lime .status-badge i {
  background: var(--mp-lime);
}

.goal-status-card--orange .goal-status-card__glow,
.goal-status-card--orange .progress-track span,
.goal-status-card--orange .status-badge i {
  background: var(--mp-orange);
}

.goal-status-card--red .goal-status-card__glow,
.goal-status-card--red .progress-track span,
.goal-status-card--red .status-badge i {
  background: var(--mp-red);
}

.goal-status-card--cyan .goal-status-card__glow,
.goal-status-card--cyan .progress-track span,
.goal-status-card--cyan .status-badge i {
  background: var(--mp-cyan);
}

.goal-status-card__header,
.goal-progress,
.goal-status-card__footer {
  position: relative;
  z-index: 1;
}

.goal-status-card__header {
  align-items: flex-start;
  margin-bottom: 24px;
}

.goal-status-card__header h3 {
  margin: 0;
  font-size: var(--font-size-md);
}

.goal-status-card__header p {
  margin-top: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-full);
  padding: 7px 10px;
  background: var(--mp-surface-strong);
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.goal-status-card--lime .status-badge {
  color: var(--mp-lime);
}

.goal-status-card--orange .status-badge {
  color: var(--mp-orange);
}

.goal-status-card--red .status-badge {
  color: var(--mp-red);
}

.goal-status-card--cyan .status-badge {
  color: var(--mp-cyan);
}

.status-badge i {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  box-shadow: 0 0 10px currentColor;
}

.goal-progress__amounts strong {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-2xl);
}

.goal-progress__amounts span,
.goal-progress__footer span,
.goal-status-card__footer span {
  color: var(--mp-muted);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-sm);
}

.progress-track {
  overflow: hidden;
  height: 8px;
  margin: 12px 0 9px;
  border-radius: var(--radius-full);
  background: var(--mp-track);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  box-shadow: 0 0 16px currentColor;
}

.goal-progress__footer strong {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-xs);
}

.goal-status-card--lime .goal-progress__footer strong {
  color: var(--mp-lime);
}

.goal-status-card--orange .goal-progress__footer strong {
  color: var(--mp-orange);
}

.goal-status-card--red .goal-progress__footer strong {
  color: var(--mp-red);
}

.goal-status-card__footer {
  margin-top: 20px;
  border-top: 1px solid var(--mp-border);
  padding-top: 16px;
}

.goal-status-card__completion {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  border: 1px solid var(--color-positive-border);
  border-radius: var(--radius-sm);
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--color-positive-bg);
}

.goal-status-card__completion strong {
  color: var(--mp-lime);
  font-size: var(--font-size-sm);
}

.goal-status-card__completion span {
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
}

.goal-status-card__footer strong {
  color: var(--mp-text);
}

.goal-status-card__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-status-card__footer button {
  border: 0;
  padding: 4px;
  background: transparent;
  color: var(--mp-muted);
}

.goal-status-card__register,
.goal-status-card__complete {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  border: 1px solid var(--color-brand-glow-md) !important;
  border-radius: var(--radius-full);
  padding: 0 10px !important;
  color: var(--mp-cyan) !important;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
}

.goal-status-card__complete {
  border-color: var(--color-positive-border) !important;
  color: var(--mp-lime) !important;
}

.goal-status-card__complete:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.goal-status-card__details {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-brand-glow-md) !important;
  border-radius: var(--radius-full);
  padding: 0 10px !important;
  color: var(--mp-cyan) !important;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
}

.goals-analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(310px, 1fr);
  gap: 24px;
}

.chart-heading {
  align-items: flex-start;
  margin-bottom: 18px;
}

.range-tabs {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-sm);
  padding: 4px;
  background: var(--mp-surface);
}

.contribution-simulator {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-weight: var(--font-weight-bold);
}

.mp-select {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-sm);
  margin-bottom: 26px;
  padding: 0 14px;
  background: var(--mp-surface);
  color: var(--mp-text);
  font: inherit;
}

.slider-block {
  display: grid;
  gap: 14px;
  margin-bottom: 28px;
}

.slider-block strong {
  color: var(--mp-cyan);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-xl);
}

.slider-block input {
  accent-color: var(--mp-cyan);
}

.slider-limits {
  display: flex;
  justify-content: space-between;
  color: var(--mp-muted);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-xs);
}

.simulation-impact {
  margin-top: auto;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-md);
  padding: 20px;
  background: var(--mp-surface);
}

.simulation-impact h3 {
  margin: 0 0 16px;
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.simulation-impact dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.simulation-impact dd {
  margin: 0;
  color: var(--mp-text);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-weight: var(--font-weight-bold);
}

.simulation-impact dd.is-lime {
  color: var(--mp-lime);
}

.simulation-impact dd.is-cyan {
  color: var(--mp-cyan);
}

@media (max-width: 1100px) {
  .action-grid,
  .goal-card-grid,
  .goals-analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .goals-market-pulse {
    gap: 22px;
  }

  .goals-market-pulse__header,
  .section-toolbar,
  .chart-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .goals-market-pulse__actions,
  .toolbar-actions {
    flex-wrap: wrap;
  }

  .filter-tabs {
    overflow-x: auto;
    width: 100%;
  }

  .action-highlights,
  .goals-timeline,
  .contribution-simulator,
  .goal-status-card {
    padding: 18px;
  }

  .goal-status-card__header,
  .goal-progress__amounts,
  .goal-progress__footer,
  .goal-status-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
