<script setup lang="ts">
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Flag,
  Minus,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";
import { NButton, NProgress, NTag } from "naive-ui";

import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import GoalContributionModal from "~/components/goal/GoalContributionModal/GoalContributionModal.vue";
import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useUpdateGoalMutation } from "~/features/goals/queries/use-update-goal-mutation";
import { useGoalContributionsQuery } from "~/features/goals/queries/use-goal-contributions-query";
import type { GoalContributionDto } from "~/features/goals/contracts/contributions.dto";
import type {
  CreateGoalPayload,
  GoalDto,
  GoalStatus,
} from "~/features/goals/contracts/goal.dto";
import {
  buildGoalHubSummary,
  normalizeGoalHubItem,
  pickDefaultGoalHubItem,
  sortGoalHubItems,
  type GoalHubItem,
  type GoalHubTone,
} from "~/features/goals/model/goal-hub";
import type { ContributionDirection } from "~/features/goals/model/contribution-amount";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Metas",
  pageSubtitle: "Objetivos e progresso.",
});

useHead({ title: "Metas | Auraxis" });

type FilterValue = "all" | GoalStatus;

const { data: goals, isLoading, isError } = useGoalsQuery();
const createMutation = useCreateGoalMutation();
const updateMutation = useUpdateGoalMutation();

const activeFilter = ref<FilterValue>("all");
const showForm = ref<boolean>(false);
const editingGoal = ref<GoalDto | null>(null);
const contributionTarget = ref<GoalDto | null>(null);
const contributionDirection = ref<ContributionDirection>("deposit");
const isContributionModalOpen = ref<boolean>(false);
const selectedGoalId = ref<string | null>(null);
const contributionPage = ref<number>(1);

const filterOptions = computed((): Array<{ value: FilterValue; label: string }> => [
  { value: "all", label: "Todas" },
  { value: "active", label: t("pages.goals.filters.active") },
  { value: "completed", label: t("pages.goals.filters.completed") },
  { value: "paused", label: t("pages.goals.filters.paused") },
]);

const allGoals = computed(() => goals.value ?? []);

const hubItems = computed(() =>
  allGoals.value.map((goal) => normalizeGoalHubItem(goal)),
);

const goalCards = computed(() => sortGoalHubItems(hubItems.value));

const visibleGoalCards = computed(() => {
  if (activeFilter.value === "all") {
    return goalCards.value;
  }

  return goalCards.value.filter((goal) => goal.raw.status === activeFilter.value);
});

const goalSummary = computed(() => buildGoalHubSummary(hubItems.value));

const selectedGoal = computed<GoalHubItem | null>(() => {
  if (selectedGoalId.value) {
    const selected = goalCards.value.find((goal) => goal.id === selectedGoalId.value);
    if (selected) {
      return selected;
    }
  }

  return pickDefaultGoalHubItem(goalCards.value);
});

const selectedGoalQueryId = computed(() => selectedGoal.value?.id ?? null);

const {
  data: selectedContributions,
  isLoading: isContributionsLoading,
} = useGoalContributionsQuery(selectedGoalQueryId, contributionPage);

const latestContribution = computed<GoalContributionDto | null>(
  () => selectedContributions.value?.items[0] ?? null,
);

const goalHealthText = computed(() => {
  if (goalSummary.value.reachedCount > 0) {
    return `${goalSummary.value.reachedCount} meta(s) prontas para conclusão`;
  }

  if (goalSummary.value.attentionCount > 0) {
    return `${goalSummary.value.attentionCount} meta(s) pedem ajuste de ritmo`;
  }

  return "Metas ativas em ritmo saudável";
});

const selectedDiagnosis = computed(() => {
  const goal = selectedGoal.value;
  if (!goal) {
    return "Selecione uma meta para revisar prazo, ritmo e próximo aporte.";
  }

  if (goal.isReached) {
    return "A meta já atingiu o valor alvo. Revise o objetivo e conclua quando fizer sentido para sua rotina.";
  }

  if (goal.tone === "danger") {
    return "O prazo já passou. Ajuste o alvo, registre um aporte ou revise se esta meta deve continuar ativa.";
  }

  if (goal.tone === "warning") {
    return "Esta meta está perto do prazo. Um aporte extra agora reduz o risco de atraso.";
  }

  if (goal.tone === "paused") {
    return "Meta pausada. Reative quando ela voltar a competir pelo próximo real disponível.";
  }

  return "O ritmo atual está saudável. Use aportes extras para antecipar o objetivo sem pressionar o caixa.";
});

/**
 * Formats a date-only value in a compact PT-BR style.
 *
 * @param value ISO date string.
 * @returns Localized date label.
 */
function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

/**
 * Formats a contribution date in a compact PT-BR style.
 *
 * @param value ISO date string.
 * @returns Localized date label.
 */
function formatContributionDate(value: string): string {
  return formatDate(value);
}

/**
 * Formats the signed amount of a contribution.
 *
 * @param contribution Contribution data.
 * @returns Signed currency label.
 */
function formatContributionAmount(contribution: GoalContributionDto): string {
  const prefix = contribution.amount >= 0 ? "+" : "-";
  return `${prefix} ${formatCurrency(Math.abs(contribution.amount))}`;
}

/**
 * Maps goal tone to Naive UI tag type.
 *
 * @param tone Goal status tone.
 * @returns Naive tag type.
 */
function toneTagType(tone: GoalHubTone): "success" | "warning" | "error" | "info" | "default" {
  if (tone === "achieved" || tone === "completed") {
    return "success";
  }

  if (tone === "danger") {
    return "error";
  }

  if (tone === "warning") {
    return "warning";
  }

  if (tone === "healthy") {
    return "info";
  }

  return "default";
}

/**
 * Opens the form in create mode.
 */
const onNewGoal = (): void => {
  editingGoal.value = null;
  showForm.value = true;
};

/**
 * Opens the form in edit mode for a selected goal.
 *
 * @param goal Goal to edit.
 */
const onEditGoal = (goal: GoalHubItem): void => {
  editingGoal.value = goal.raw;
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
 * Selects a goal in the hub.
 *
 * @param id Goal identifier.
 */
const onSelectGoal = (id: string): void => {
  selectedGoalId.value = id;
};

/**
 * Opens the dedicated detail route for a selected goal.
 *
 * @param goal Goal selected in the hub.
 */
const openGoalDetails = (goal: GoalHubItem): void => {
  void navigateTo(`/goals/${goal.id}`);
};

/**
 * Detects goals that reached the target but were not explicitly closed yet.
 *
 * @param goal Goal selected in the hub.
 * @returns True when the completion CTA should be visible.
 */
function isGoalReached(goal: GoalHubItem): boolean {
  return goal.isReached;
}

/**
 * Opens the contribution modal for a selected goal.
 *
 * @param goal Goal selected in the hub.
 * @param direction Initial contribution direction.
 */
const onRegisterContribution = (
  goal: GoalHubItem,
  direction: ContributionDirection = "deposit",
): void => {
  contributionTarget.value = goal.raw;
  contributionDirection.value = direction;
  isContributionModalOpen.value = true;
};

/**
 * Explicitly closes a reached goal after the user confirms the intent via CTA.
 *
 * @param goal Goal selected in the hub.
 */
const onConcludeGoal = (goal: GoalHubItem): void => {
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
    const currentSelectionExists = selectedGoalId.value
      ? items.some((goal) => goal.id === selectedGoalId.value)
      : false;

    if (!currentSelectionExists) {
      selectedGoalId.value = pickDefaultGoalHubItem(items)?.id ?? null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="goals-hub">
    <UiInlineError
      v-if="isError"
      :title="$t('pages.goals.loadError')"
      :message="$t('pages.goals.loadErrorMessage')"
    />

    <template v-else>
      <section class="goals-hub__command" aria-label="Central de progresso das metas">
        <div class="goals-hub__command-copy">
          <span class="goals-hub__eyebrow">
            <Sparkles :size="16" aria-hidden="true" />
            Central de progresso
          </span>
          <p>
            Metas mostram onde o próximo real disponível cria mais avanço: conclua objetivos
            alcançados, registre entradas e peça ideias para acelerar sem perder folga no mês.
          </p>
        </div>

        <div class="goals-hub__command-actions">
          <NButton secondary>
            <template #icon>
              <Download :size="18" />
            </template>
            Relatório
          </NButton>
          <NButton
            secondary
            type="primary"
            :disabled="!selectedGoal"
            @click="selectedGoal && onRegisterContribution(selectedGoal)"
          >
            <template #icon>
              <CircleDollarSign :size="18" />
            </template>
            Registrar entrada
          </NButton>
          <NButton type="primary" @click="onNewGoal">
            <template #icon>
              <Plus :size="18" />
            </template>
            Nova meta
          </NButton>
        </div>
      </section>

      <UiPageLoader v-if="isLoading" :rows="3" />

      <section v-else-if="goalCards.length === 0" class="goals-hub__empty" aria-label="Metas vazias">
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

      <template v-else>
        <section class="goals-hub__metrics" aria-label="Resumo das metas">
          <article class="goals-hub__metric">
            <div class="goals-hub__metric-icon goals-hub__metric-icon--brand">
              <Target :size="18" aria-hidden="true" />
            </div>
            <span>Metas ativas</span>
            <strong>{{ goalSummary.activeCount }}</strong>
          </article>

          <article class="goals-hub__metric">
            <div class="goals-hub__metric-icon goals-hub__metric-icon--positive">
              <Wallet :size="18" aria-hidden="true" />
            </div>
            <span>Guardado</span>
            <strong>{{ formatCurrency(goalSummary.totalCurrent) }}</strong>
          </article>

          <article class="goals-hub__metric">
            <div class="goals-hub__metric-icon goals-hub__metric-icon--warning">
              <Flag :size="18" aria-hidden="true" />
            </div>
            <span>Falta</span>
            <strong>{{ formatCurrency(goalSummary.totalRemaining) }}</strong>
          </article>

          <article
            class="goals-hub__metric"
            :class="{ 'goals-hub__metric--danger': goalSummary.attentionCount > 0 }"
          >
            <div class="goals-hub__metric-icon goals-hub__metric-icon--info">
              <TrendingUp :size="18" aria-hidden="true" />
            </div>
            <span>Próximo real disponível</span>
            <strong>{{ goalSummary.reachedCount > 0 ? 'Concluir' : 'Priorizar' }}</strong>
          </article>
        </section>

        <section class="goals-hub__health" aria-label="Saúde geral das metas">
          <div class="goals-hub__health-copy">
            <CheckCircle2 v-if="goalSummary.attentionCount === 0" :size="18" aria-hidden="true" />
            <AlertTriangle v-else :size="18" aria-hidden="true" />
            <span>{{ goalHealthText }}</span>
          </div>
          <NProgress
            class="goals-hub__overall-progress"
            type="line"
            :percentage="goalSummary.overallProgress"
            :status="goalSummary.attentionCount > 0 ? 'warning' : 'default'"
            :show-indicator="true"
            aria-label="Progresso agregado das metas ativas"
          />
        </section>

        <section class="goals-hub__review-grid">
          <div class="goals-hub__goal-list" aria-label="Lista de metas">
            <div class="goals-hub__list-header">
              <div>
                <span>Metas</span>
                <strong>{{ goalCards.length }} no radar</strong>
              </div>
              <NTag type="info" size="small">ordenado por prioridade</NTag>
            </div>

            <div class="goals-hub__filters" aria-label="Filtro de metas">
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

            <div v-if="visibleGoalCards.length === 0" class="goals-hub__empty-filter">
              Nenhuma meta neste filtro.
            </div>

            <template v-else>
              <button
                v-for="goal in visibleGoalCards"
                :key="goal.id"
                class="goal-row"
                :class="[
                  `goal-row--${goal.tone}`,
                  { 'goal-row--selected': selectedGoal?.id === goal.id },
                ]"
                type="button"
                :aria-pressed="selectedGoal?.id === goal.id"
                @click="onSelectGoal(goal.id)"
              >
                <span class="goal-row__accent" aria-hidden="true" />

                <span class="goal-row__main">
                  <span class="goal-row__name">{{ goal.name }}</span>
                  <span class="goal-row__meta">
                    <CalendarDays :size="14" aria-hidden="true" />
                    {{ formatDate(goal.targetDate) }}
                  </span>
                </span>

                <span class="goal-row__numbers">
                  <span>
                    <strong>{{ formatCurrency(goal.currentAmount) }}</strong>
                    <small>de {{ formatCurrency(goal.targetAmount) }}</small>
                  </span>
                  <NTag :type="toneTagType(goal.tone)" size="small">
                    {{ goal.statusLabel }}
                  </NTag>
                </span>

                <span class="goal-row__progress">
                  <NProgress
                    type="line"
                    :aria-label="`Progresso da meta ${goal.name}`"
                    :percentage="goal.progressPercentage"
                    :status="goal.progressStatus"
                    :show-indicator="false"
                  />
                  <span>{{ goal.progress }}%</span>
                </span>

                <span class="goal-row__remaining">
                  {{ formatCurrency(goal.remainingAmount) }}
                </span>
              </button>
            </template>
          </div>

          <aside class="goals-hub__detail-panel" aria-label="Detalhe da meta selecionada">
            <template v-if="selectedGoal">
              <div class="detail-panel__header">
                <div>
                  <span class="detail-panel__eyebrow">
                    <Target :size="16" aria-hidden="true" />
                    Meta selecionada
                  </span>
                  <h2>{{ selectedGoal.name }}</h2>
                </div>
                <NTag :type="toneTagType(selectedGoal.tone)">
                  {{ selectedGoal.statusLabel }}
                </NTag>
              </div>

              <div class="detail-panel__hero">
                <div class="detail-panel__hero-copy">
                  <span>Guardado até agora</span>
                  <strong>{{ formatCurrency(selectedGoal.currentAmount) }}</strong>
                  <small>Alvo de {{ formatCurrency(selectedGoal.targetAmount) }}</small>
                </div>
                <div
                  class="detail-panel__orb"
                  :class="`detail-panel__orb--${selectedGoal.tone}`"
                  aria-hidden="true"
                >
                  {{ selectedGoal.progress }}%
                </div>
              </div>

              <NProgress
                type="line"
                :aria-label="`Progresso da meta ${selectedGoal.name}`"
                :percentage="selectedGoal.progressPercentage"
                :status="selectedGoal.progressStatus"
                :show-indicator="false"
              />

              <div class="detail-panel__facts">
                <article>
                  <CalendarDays :size="17" aria-hidden="true" />
                  <span>Prazo</span>
                  <strong>{{ formatDate(selectedGoal.targetDate) }}</strong>
                </article>
                <article>
                  <Flag :size="17" aria-hidden="true" />
                  <span>Falta</span>
                  <strong>{{ formatCurrency(selectedGoal.remainingAmount) }}</strong>
                </article>
                <article>
                  <CircleDollarSign :size="17" aria-hidden="true" />
                  <span>Aporte sugerido</span>
                  <strong>{{ formatCurrency(selectedGoal.requiredMonthlyContribution) }}/mês</strong>
                </article>
              </div>

              <div
                class="detail-panel__diagnosis"
                :class="`detail-panel__diagnosis--${selectedGoal.tone}`"
              >
                <AlertTriangle
                  v-if="selectedGoal.tone === 'danger' || selectedGoal.tone === 'warning'"
                  :size="18"
                  aria-hidden="true"
                />
                <CheckCircle2 v-else :size="18" aria-hidden="true" />
                <p>{{ selectedDiagnosis }}</p>
              </div>

              <div v-if="isGoalReached(selectedGoal)" class="detail-panel__completion">
                <CheckCircle2 :size="18" aria-hidden="true" />
                <div>
                  <strong>Meta alcançada</strong>
                  <p>O saldo já cobre o objetivo. Conclua quando quiser arquivar a meta como resolvida.</p>
                </div>
              </div>

              <section class="detail-panel__movement" aria-label="Último movimento">
                <div>
                  <span>Último movimento</span>
                  <strong v-if="latestContribution">
                    {{ formatContributionAmount(latestContribution) }}
                  </strong>
                  <strong v-else-if="isContributionsLoading">Carregando</strong>
                  <strong v-else>Nenhum aporte registrado</strong>
                </div>
                <p v-if="latestContribution">
                  {{ formatContributionDate(latestContribution.occurred_at) }}
                  <template v-if="latestContribution.note"> · {{ latestContribution.note }}</template>
                </p>
                <p v-else>
                  Registre uma entrada para transformar a meta em acompanhamento real.
                </p>
              </section>

              <div class="detail-panel__actions">
                <NButton type="primary" @click="onRegisterContribution(selectedGoal)">
                  <template #icon>
                    <Plus :size="18" />
                  </template>
                  Registrar entrada
                </NButton>
                <NButton secondary @click="onRegisterContribution(selectedGoal, 'withdrawal')">
                  <template #icon>
                    <Minus :size="18" />
                  </template>
                  Registrar retirada
                </NButton>
                <NButton
                  v-if="isGoalReached(selectedGoal)"
                  secondary
                  type="success"
                  :loading="updateMutation.isPending.value"
                  @click="onConcludeGoal(selectedGoal)"
                >
                  Concluir meta
                </NButton>
                <NButton secondary @click="onEditGoal(selectedGoal)">Editar</NButton>
                <NButton secondary @click="openGoalDetails(selectedGoal)">
                  Ver detalhes
                  <template #icon>
                    <ArrowUpRight :size="15" />
                  </template>
                </NButton>
              </div>

              <section class="detail-panel__ai" aria-label="IA para próximos aportes">
                <div class="detail-panel__ai-head">
                  <Bot :size="18" aria-hidden="true" />
                  <div>
                    <span>IA para próximos aportes</span>
                    <p>
                      Peça ideias de como dinheiro remanescente no mês pode acelerar esta meta
                      sem registrar nada automaticamente.
                    </p>
                  </div>
                </div>
                <AiInsightSurface dimension="goals" source-surface="goals" />
              </section>
            </template>
          </aside>
        </section>
      </template>
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
      :initial-direction="contributionDirection"
    />
  </div>
</template>

<style scoped>
.goals-hub {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.goals-hub__command {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 12% 0%, var(--color-brand-glow-xs), transparent 34%),
    linear-gradient(135deg, var(--color-bg-surface), var(--color-bg-elevated));
  box-shadow: var(--shadow-card);
}

.goals-hub__command-copy {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.goals-hub__eyebrow,
.detail-panel__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.goals-hub__command-copy p {
  max-width: 820px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

.goals-hub__command-actions,
.detail-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.goals-hub__empty {
  min-height: 420px;
  padding: var(--space-5) 0;
  border: 1px dashed color-mix(in srgb, var(--color-brand-500) 34%, transparent);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 44%),
    color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
}

.goals-hub__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.goals-hub__metric {
  display: grid;
  gap: var(--space-2);
  min-height: 132px;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  box-shadow: var(--shadow-card);
}

.goals-hub__metric span,
.detail-panel__facts span,
.detail-panel__hero-copy span,
.goal-row__meta,
.goal-row__numbers small,
.detail-panel__movement span,
.detail-panel__ai-head span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.goals-hub__metric strong {
  align-self: end;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  line-height: 1.15;
}

.goals-hub__metric--danger strong {
  color: var(--color-warning);
}

.goals-hub__metric-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.goals-hub__metric-icon--brand {
  color: var(--color-brand-500);
  background: var(--color-brand-hover-surface);
}

.goals-hub__metric-icon--positive {
  color: var(--color-positive);
  background: var(--color-positive-bg);
}

.goals-hub__metric-icon--warning {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.goals-hub__metric-icon--info {
  color: var(--color-info);
  background: var(--color-info-bg);
}

.goals-hub__health {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.goals-hub__health-copy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.goals-hub__overall-progress {
  max-width: 100%;
}

.goals-hub__review-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.38fr) minmax(380px, 0.92fr);
  gap: var(--space-4);
  align-items: start;
}

.goals-hub__goal-list,
.goals-hub__detail-panel {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.goals-hub__goal-list {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
}

.goals-hub__list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-2);
}

.goals-hub__list-header > div {
  display: grid;
  gap: 2px;
}

.goals-hub__list-header span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.goals-hub__list-header strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.goals-hub__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}

.goals-hub__filters button {
  min-height: 30px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  padding: 0 var(--space-2);
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.goals-hub__filters button.is-active,
.goals-hub__filters button:hover {
  border-color: var(--color-outline-hard);
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.goals-hub__empty-filter {
  padding: var(--space-4);
  color: var(--color-text-secondary);
  text-align: center;
}

.goal-row {
  display: grid;
  grid-template-columns: 4px minmax(180px, 1.3fr) minmax(190px, 0.9fr) minmax(140px, 0.7fr) minmax(110px, 0.45fr);
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.goal-row:hover,
.goal-row--selected {
  border-color: color-mix(in srgb, var(--color-brand-500) 45%, var(--color-outline-hard));
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 55%),
    var(--color-bg-surface);
}

.goal-row--selected {
  transform: translateY(-1px);
}

.goal-row__accent {
  align-self: stretch;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
}

.goal-row--achieved .goal-row__accent,
.goal-row--completed .goal-row__accent {
  background: var(--color-positive);
}

.goal-row--danger .goal-row__accent {
  background: var(--color-negative);
}

.goal-row--warning .goal-row__accent {
  background: var(--color-warning);
}

.goal-row--paused .goal-row__accent,
.goal-row--cancelled .goal-row__accent {
  background: var(--color-text-muted);
}

.goal-row__main,
.goal-row__numbers,
.goal-row__progress {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.goal-row__name {
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-extrabold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-row__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.goal-row__numbers strong,
.goal-row__remaining,
.detail-panel__hero-copy strong,
.detail-panel__facts strong,
.detail-panel__movement strong {
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.goal-row__numbers > span {
  display: grid;
  gap: 3px;
}

.goal-row__progress > span {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.goal-row__remaining {
  justify-self: end;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.goals-hub__detail-panel {
  position: sticky;
  top: var(--space-4);
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
}

.detail-panel__header,
.detail-panel__hero,
.detail-panel__actions,
.detail-panel__ai-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.detail-panel__header h2 {
  margin: 4px 0 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  line-height: 1.18;
}

.detail-panel__hero {
  align-items: center;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 48%),
    var(--color-bg-elevated);
}

.detail-panel__hero-copy {
  display: grid;
  gap: 4px;
}

.detail-panel__hero-copy strong {
  font-size: var(--font-size-2xl);
}

.detail-panel__hero-copy small {
  color: var(--color-text-secondary);
}

.detail-panel__orb {
  display: inline-flex;
  width: 86px;
  height: 86px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--color-brand-glow-md);
  border-radius: var(--radius-full);
  color: var(--color-brand-500);
  background: var(--color-brand-hover-surface);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.detail-panel__orb--achieved,
.detail-panel__orb--completed {
  border-color: var(--color-positive-border);
  color: var(--color-positive);
  background: var(--color-positive-bg);
}

.detail-panel__orb--danger {
  border-color: color-mix(in srgb, var(--color-negative) 42%, transparent);
  color: var(--color-negative);
  background: var(--color-negative-bg);
}

.detail-panel__orb--warning {
  border-color: var(--color-warning-glow);
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.detail-panel__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.detail-panel__facts article {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}

.detail-panel__facts svg {
  color: var(--color-brand-500);
}

.detail-panel__facts strong {
  overflow-wrap: anywhere;
  font-size: var(--font-size-sm);
}

.detail-panel__diagnosis {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-positive-border);
  border-radius: var(--radius-md);
  color: var(--color-positive);
  background: var(--color-positive-bg);
}

.detail-panel__diagnosis--danger {
  border-color: color-mix(in srgb, var(--color-negative) 42%, transparent);
  color: var(--color-negative);
  background: var(--color-negative-bg);
}

.detail-panel__diagnosis--warning {
  border-color: var(--color-warning-glow);
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.detail-panel__diagnosis--paused,
.detail-panel__diagnosis--cancelled {
  border-color: var(--color-outline-soft);
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
}

.detail-panel__diagnosis p {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.detail-panel__completion {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-positive-border);
  border-radius: var(--radius-md);
  color: var(--color-positive);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--color-positive) 14%, transparent), transparent 42%),
    var(--color-positive-bg);
}

.detail-panel__completion strong {
  display: block;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.detail-panel__completion p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.detail-panel__movement,
.detail-panel__ai {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.detail-panel__movement > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.detail-panel__movement p,
.detail-panel__ai-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.detail-panel__ai {
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 52%),
    var(--color-bg-elevated);
}

.detail-panel__ai-head {
  justify-content: flex-start;
}

.detail-panel__ai-head svg {
  flex: 0 0 auto;
  color: var(--color-brand-500);
}

@media (prefers-reduced-motion: reduce) {
  .goal-row {
    transition: none;
  }
}

@media (max-width: 1180px) {
  .goals-hub__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .goals-hub__review-grid {
    grid-template-columns: 1fr;
  }

  .goals-hub__detail-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .goals-hub {
    padding: var(--space-3);
  }

  .goals-hub__command,
  .goals-hub__command-actions,
  .detail-panel__header,
  .detail-panel__hero,
  .detail-panel__movement > div {
    align-items: stretch;
    flex-direction: column;
  }

  .goals-hub__command-actions {
    width: 100%;
  }

  .goals-hub__command-actions :deep(.n-button) {
    width: 100%;
  }

  .goals-hub__metrics,
  .detail-panel__facts {
    grid-template-columns: 1fr;
  }

  .goal-row {
    grid-template-columns: 4px minmax(0, 1fr);
  }

  .goal-row__numbers,
  .goal-row__progress,
  .goal-row__remaining {
    grid-column: 2;
    justify-self: stretch;
  }

  .detail-panel__actions {
    justify-content: stretch;
  }

  .detail-panel__actions :deep(.n-button) {
    flex: 1 1 100%;
  }
}
</style>
