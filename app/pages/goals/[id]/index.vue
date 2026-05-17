<script setup lang="ts">
import { ArrowLeft, CalendarClock, PiggyBank, Target, TrendingUp } from "lucide-vue-next";

import GoalAiContextPanel from "~/components/goal/GoalAiContextPanel/GoalAiContextPanel.vue";
import GoalProjectionPanel from "~/components/goal/GoalProjectionPanel/GoalProjectionPanel.vue";
import { useGoalProjectionQuery } from "~/features/goals/queries/use-goal-projection-query";
import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Detalhe da meta",
  pageSubtitle: "Projeção, contexto e recomendações.",
});

useHead({ title: "Detalhe da Meta | Auraxis" });

const DEMO_GOALS: GoalDto[] = [
  {
    id: "market-pulse-emergency",
    name: "Reserva de Emergência",
    description: "Liquidez para seis meses de despesas essenciais.",
    target_amount: 30000,
    current_amount: 24500,
    target_date: "2026-12-31",
    status: "active",
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "market-pulse-car",
    name: "Carro Novo SUV",
    description: "Entrada planejada com proteção contra inflação do veículo.",
    target_amount: 120000,
    current_amount: 45000,
    target_date: "2027-03-31",
    status: "active",
    created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "market-pulse-trip",
    name: "Viagem Europa",
    description: "Viagem familiar com passagens, hospedagem e reservas.",
    target_amount: 35000,
    current_amount: 15200,
    target_date: "2026-07-31",
    status: "paused",
    created_at: "2026-03-12T10:00:00Z",
  },
];

const route = useRoute();
const goalId = computed(() => String(route.params.id ?? ""));
const goalIdRef = computed<string | null>(() => goalId.value || null);
const savedNote = ref<string | null>(null);

const goalsQuery = useGoalsQuery();
const projectionQuery = useGoalProjectionQuery(goalIdRef);

const endDate = computed(() => new Date().toISOString().slice(0, 10));
const startDate = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date.toISOString().slice(0, 10);
});

const recentTransactionFilters = computed(() => ({
  start_date: startDate.value,
  end_date: endDate.value,
}));

const transactionsQuery = useListTransactionsQuery(recentTransactionFilters);

const selectedGoal = computed<GoalDto | null>(() => {
  const goals = goalsQuery.data.value ?? [];
  return goals.find((goal) => goal.id === goalId.value)
    ?? DEMO_GOALS.find((goal) => goal.id === goalId.value)
    ?? null;
});

const isLoading = computed(() => goalsQuery.isLoading.value && selectedGoal.value === null);
const hasError = computed(() => goalsQuery.isError.value);

const progress = computed(() => {
  if (!selectedGoal.value || selectedGoal.value.target_amount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((selectedGoal.value.current_amount / selectedGoal.value.target_amount) * 100)),
  );
});

const remainingAmount = computed(() => {
  if (!selectedGoal.value) {
    return 0;
  }

  return Math.max(selectedGoal.value.target_amount - selectedGoal.value.current_amount, 0);
});

const monthlyContribution = computed(() => {
  const raw = projectionQuery.data.value?.projection.monthly_contribution;
  const parsed = raw ? Number(raw) : 0;

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  if (!selectedGoal.value) {
    return 0;
  }

  const deadline = selectedGoal.value.target_date
    ? new Date(`${selectedGoal.value.target_date}T00:00:00`)
    : null;
  const now = new Date();
  const monthsUntilDeadline = deadline
    ? Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()))
    : 12;

  return Math.max(100, Math.ceil(remainingAmount.value / monthsUntilDeadline));
});

const recentTransactions = computed<readonly TransactionDto[]>(() => transactionsQuery.data.value ?? []);

const targetDateLabel = computed(() => {
  const date = selectedGoal.value?.target_date;

  if (!date) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
});

/**
 * Stores the generated narrative as an in-page note preview.
 *
 * @param projection Generated AI projection payload.
 * @param projection.narrative Narrative returned by the AI provider.
 */
const onSaveNote = (projection: { narrative: string }): void => {
  savedNote.value = projection.narrative;
};
</script>

<template>
  <div class="goal-detail-page">
    <button class="goal-detail-page__back" type="button" @click="navigateTo('/goals')">
      <ArrowLeft :size="16" aria-hidden="true" />
      Voltar para metas
    </button>

    <UiInlineError
      v-if="hasError"
      title="Não foi possível carregar a meta"
      message="Atualize a página ou tente novamente em instantes."
    />

    <UiPageLoader v-else-if="isLoading" :rows="4" :with-title="true" />

    <UiInlineError
      v-else-if="!selectedGoal"
      title="Meta não encontrada"
      message="Essa meta não existe ou não está disponível para sua conta."
    />

    <template v-else>
      <section class="goal-detail-hero">
        <div>
          <span class="goal-detail-hero__eyebrow">Meta financeira</span>
          <h1>{{ selectedGoal.name }}</h1>
          <p>{{ selectedGoal.description ?? "Acompanhe o progresso e ajuste o plano com IA." }}</p>
        </div>

        <div class="goal-detail-hero__progress" aria-label="Progresso da meta">
          <strong>{{ progress }}%</strong>
          <span>concluído</span>
        </div>
      </section>

      <section class="goal-detail-metrics" aria-label="Resumo da meta">
        <article>
          <Target :size="18" aria-hidden="true" />
          <span>Objetivo</span>
          <strong>{{ formatCurrency(selectedGoal.target_amount) }}</strong>
        </article>
        <article>
          <PiggyBank :size="18" aria-hidden="true" />
          <span>Acumulado</span>
          <strong>{{ formatCurrency(selectedGoal.current_amount) }}</strong>
        </article>
        <article>
          <TrendingUp :size="18" aria-hidden="true" />
          <span>Aporte base</span>
          <strong>{{ formatCurrency(monthlyContribution) }}</strong>
        </article>
        <article>
          <CalendarClock :size="18" aria-hidden="true" />
          <span>Prazo</span>
          <strong>{{ targetDateLabel }}</strong>
        </article>
      </section>

      <section class="goal-detail-progress">
        <div class="goal-detail-progress__track" aria-hidden="true">
          <span :style="{ width: `${progress}%` }" />
        </div>
        <div>
          <span>Faltam {{ formatCurrency(remainingAmount) }}</span>
          <strong>{{ recentTransactions.length }} transações recentes consideradas</strong>
        </div>
      </section>

      <details class="goal-detail-ai" open>
        <summary>Contexto e projeção com IA</summary>
        <GoalAiContextPanel
          :goal="selectedGoal"
          :monthly-contribution="monthlyContribution"
          :recent-transactions="recentTransactions"
          @save-note="onSaveNote"
        />
      </details>

      <section v-if="savedNote" class="goal-detail-note" aria-live="polite">
        <h2>Nota salva nesta sessão</h2>
        <p>{{ savedNote }}</p>
      </section>

      <GoalProjectionPanel :goal-id="goalId" />
    </template>
  </div>
</template>

<style scoped>
.goal-detail-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  width: 100%;
  min-width: 0;
  color: #f7fbff;
}

.goal-detail-page > * {
  min-width: 0;
}

.goal-detail-page__back {
  display: inline-flex;
  width: fit-content;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(130, 157, 198, 0.24);
  border-radius: var(--radius-full);
  padding: 0 14px;
  color: #8da2bf;
  background: #111827;
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
}

.goal-detail-hero,
.goal-detail-metrics article,
.goal-detail-progress,
.goal-detail-ai,
.goal-detail-note {
  min-width: 0;
  border: 1px solid rgba(130, 157, 198, 0.22);
  border-radius: var(--radius-lg);
  background: #111827;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
}

.goal-detail-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  background:
    radial-gradient(circle at 100% 0%, rgba(68, 212, 255, 0.12), transparent 30%),
    #111827;
}

.goal-detail-hero__eyebrow {
  color: #44d4ff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.goal-detail-hero h1,
.goal-detail-note h2 {
  margin: 8px 0 0;
  color: #f7fbff;
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0;
}

.goal-detail-hero h1 {
  font-size: clamp(var(--font-size-heading-xl), 4vw, var(--font-size-4xl));
  overflow-wrap: anywhere;
}

.goal-detail-hero p,
.goal-detail-note p {
  max-width: 680px;
  margin: 10px 0 0;
  color: #8da2bf;
  font-size: var(--font-size-md);
  line-height: 1.6;
}

.goal-detail-hero__progress {
  display: grid;
  min-width: 132px;
  place-items: center;
  border: 1px solid rgba(66, 232, 169, 0.28);
  border-radius: var(--radius-md);
  padding: 18px;
  background: rgba(66, 232, 169, 0.08);
}

.goal-detail-hero__progress strong {
  color: #42e8a9;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-heading-xl);
}

.goal-detail-hero__progress span {
  color: #8da2bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.goal-detail-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.goal-detail-metrics article {
  display: grid;
  gap: 8px;
  padding: 18px;
}

.goal-detail-metrics svg {
  color: #44d4ff;
}

.goal-detail-metrics span {
  color: #8da2bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.goal-detail-metrics strong {
  color: #f7fbff;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-lg);
}

.goal-detail-progress {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.goal-detail-progress__track {
  overflow: hidden;
  height: 10px;
  border-radius: var(--radius-full);
  background: #202b3e;
}

.goal-detail-progress__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #44d4ff, #42e8a9);
}

.goal-detail-progress div:last-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #8da2bf;
  font-size: var(--font-size-sm);
}

.goal-detail-progress strong {
  color: #dce8f8;
}

.goal-detail-ai {
  overflow: hidden;
}

.goal-detail-ai summary {
  display: flex;
  min-height: 58px;
  align-items: center;
  border-bottom: 1px solid rgba(130, 157, 198, 0.2);
  padding: 0 24px;
  color: #dce8f8;
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
}

.goal-detail-ai :deep(.goal-ai-panel) {
  min-width: 0;
  border: 0;
  border-radius: var(--radius-none);
  box-shadow: none;
}

.goal-detail-note {
  padding: 20px;
}

.goal-detail-note h2 {
  font-size: var(--font-size-md);
}

@media (max-width: 900px) {
  .goal-detail-hero,
  .goal-detail-progress div:last-child {
    align-items: stretch;
    flex-direction: column;
  }

  .goal-detail-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .goal-detail-hero,
  .goal-detail-progress,
  .goal-detail-note {
    padding: 18px;
  }

  .goal-detail-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
