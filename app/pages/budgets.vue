<script setup lang="ts">
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NProgress,
  NSelect,
  NSpace,
  NTag,
} from "naive-ui";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Crown,
  FileSearch,
  Gauge,
  LineChart,
  PiggyBank,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
  Tags,
  WalletCards,
} from "lucide-vue-next";

import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import type {
  BudgetDto,
  BudgetPeriod,
  CreateBudgetPayload,
} from "~/features/budgets/contracts/budget.contracts";
import {
  buildBudgetQuotaState,
  buildBudgetTransactionFilters,
  normalizeBudgetEnvelope,
  pickDefaultBudgetEnvelope,
  summarizeBudgetEnvelopes,
  type BudgetEnvelopeView,
  type BudgetUsageLevel,
} from "~/features/budgets/model/budget-envelope";
import { useBudgetsQuery } from "~/features/budgets/queries/use-budgets-query";
import { useCreateBudgetMutation } from "~/features/budgets/queries/use-create-budget-mutation";
import { useDeleteBudgetMutation } from "~/features/budgets/queries/use-delete-budget-mutation";
import { useUpdateBudgetMutation } from "~/features/budgets/queries/use-update-budget-mutation";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import type {
  TransactionDto,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import type { ListTransactionsFilters } from "~/features/transactions/services/transactions.client";
import { formatCurrency } from "~/utils/currency";
import {
  parseCurrencyAmount,
  serializeCurrencyAmount,
} from "~/utils/currencyInput";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Orçamentos",
  pageSubtitle: "Controle envelopes automáticos por período",
});

useHead({ title: "Orçamentos | Auraxis" });

const usageRiskRank: Record<BudgetUsageLevel, number> = {
  healthy: 0,
  warning: 1,
  danger: 2,
};

const usageLevelLabels: Record<BudgetUsageLevel, string> = {
  healthy: "Saudável",
  warning: "Atenção",
  danger: "Estourado",
};

const usageLevelTagTypes: Record<BudgetUsageLevel, "success" | "warning" | "error"> = {
  healthy: "success",
  warning: "warning",
  danger: "error",
};

const committedTransactionStatuses = new Set<TransactionStatusDto>([
  "paid",
  "pending",
  "overdue",
]);

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const { data: budgets, isLoading, isError } = useBudgetsQuery();
const { data: tags } = useTagsQuery();
const { data: subscription } = useSubscriptionQuery();
const createMutation = useCreateBudgetMutation();
const updateMutation = useUpdateBudgetMutation();
const deleteMutation = useDeleteBudgetMutation();

const showForm = ref<boolean>(false);
const showUpgradeModal = ref<boolean>(false);
const editingBudget = ref<BudgetDto | null>(null);
const selectedBudgetId = ref<string | null>(null);
const formName = ref<string>("");
const formAmount = ref<number | null>(null);
const formPeriod = ref<BudgetPeriod>("monthly");
const formTagId = ref<string | null>(null);
const formDateRange = ref<[number, number] | null>(null);

const allBudgets = computed(() => budgets.value ?? []);

const budgetEnvelopes = computed(() =>
  allBudgets.value.map(normalizeBudgetEnvelope),
);

const sortedBudgetEnvelopes = computed(() =>
  [...budgetEnvelopes.value].sort((left, right) => {
    const riskDelta = usageRiskRank[right.usageLevel] - usageRiskRank[left.usageLevel];
    if (riskDelta !== 0) {
      return riskDelta;
    }

    const percentageDelta = right.percentageUsed - left.percentageUsed;
    if (percentageDelta !== 0) {
      return percentageDelta;
    }

    return right.spent - left.spent;
  }),
);

const budgetSummary = computed(() => summarizeBudgetEnvelopes(budgetEnvelopes.value));

const riskEnvelopeCount = computed(
  () => budgetSummary.value.warningCount + budgetSummary.value.dangerCount,
);

const quotaState = computed(() =>
  buildBudgetQuotaState({
    budgetCount: budgetEnvelopes.value.length,
    subscription: subscription.value,
  }),
);

const quotaDescription = computed(() =>
  quotaState.value.isPremium
    ? "Seu plano atual permite criar quantos envelopes forem necessários para separar categorias, projetos e períodos."
    : "No plano gratuito, você pode acompanhar até 3 envelopes. Assine Premium para organizar categorias ilimitadas.",
);

const selectedEnvelope = computed<BudgetEnvelopeView | null>(() => {
  if (selectedBudgetId.value) {
    const selected = sortedBudgetEnvelopes.value.find(
      (envelope) => envelope.id === selectedBudgetId.value,
    );

    if (selected) {
      return selected;
    }
  }

  return pickDefaultBudgetEnvelope(sortedBudgetEnvelopes.value);
});

watch(
  sortedBudgetEnvelopes,
  (envelopes) => {
    const currentSelectionExists = selectedBudgetId.value
      ? envelopes.some((envelope) => envelope.id === selectedBudgetId.value)
      : false;

    if (!currentSelectionExists) {
      selectedBudgetId.value = pickDefaultBudgetEnvelope(envelopes)?.id ?? null;
    }
  },
  { immediate: true },
);

const selectedBudget = computed(() => selectedEnvelope.value?.raw ?? null);

/**
 * Builds a safe monthly filter while no envelope is selected yet.
 *
 * @returns Expense filters for the current month.
 */
const fallbackTransactionFilters = (): ListTransactionsFilters => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    type: "expense",
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
  };
};

const selectedTransactionFilters = computed<ListTransactionsFilters>(() =>
  selectedBudget.value
    ? buildBudgetTransactionFilters(selectedBudget.value)
    : fallbackTransactionFilters(),
);

const {
  data: transactionPreview,
  isError: isTransactionPreviewError,
  isLoading: isTransactionPreviewLoading,
} = useListTransactionsQuery(selectedTransactionFilters);

const previewTransactions = computed<TransactionDto[]>(() => {
  if (!selectedBudget.value) {
    return [];
  }

  return (transactionPreview.value ?? [])
    .filter((transaction) =>
      transaction.type === "expense"
      && committedTransactionStatuses.has(transaction.status),
    )
    .slice(0, 5);
});

const tagOptions = computed(() => {
  const opts: Array<{ label: string; value: string }> = [];
  if (tags.value) {
    for (const tag of tags.value) {
      opts.push({ label: tag.name, value: tag.id });
    }
  }
  return opts;
});

const periodOptions = computed(() => [
  { label: t("pages.budgets.period.monthly"), value: "monthly" },
  { label: t("pages.budgets.period.weekly"), value: "weekly" },
  { label: t("pages.budgets.period.custom"), value: "custom" },
]);

const isCustomPeriod = computed(() => formPeriod.value === "custom");

const budgetHealthText = computed(() => {
  if (budgetSummary.value.dangerCount > 0) {
    return `${budgetSummary.value.dangerCount} envelope(s) estourado(s)`;
  }

  if (budgetSummary.value.warningCount > 0) {
    return `${budgetSummary.value.warningCount} envelope(s) pedem atenção`;
  }

  return "Todos os envelopes estão dentro do limite";
});

const selectedPeriodLabel = computed(() => {
  const budget = selectedBudget.value;
  if (!budget) {
    return "Período";
  }

  if (budget.period === "custom" && budget.start_date && budget.end_date) {
    return `${formatDate(budget.start_date)} até ${formatDate(budget.end_date)}`;
  }

  if (budget.period === "weekly") {
    return "Semana atual";
  }

  return "Mês atual";
});

const selectedDiagnosis = computed(() => {
  const envelope = selectedEnvelope.value;
  if (!envelope) {
    return "Selecione um envelope para revisar limite, comprometido e transações associadas.";
  }

  if (envelope.usageLevel === "danger") {
    return "O limite já foi ultrapassado. Revise as transações vinculadas e ajuste o teto caso esse gasto seja recorrente.";
  }

  if (envelope.usageLevel === "warning") {
    return "Este envelope está perto do limite. Vale revisar lançamentos pendentes antes de assumir novos gastos.";
  }

  return "O envelope está saudável. Continue acompanhando as entradas do período para preservar a folga.";
});

/**
 * Returns the display label for a budget usage level.
 *
 * @param level Budget usage level.
 * @returns Human-readable label.
 */
const usageLevelLabel = (level: BudgetUsageLevel): string => usageLevelLabels[level];

/**
 * Returns the Naive UI tag type for a budget usage level.
 *
 * @param level Budget usage level.
 * @returns Naive UI tag type.
 */
const usageLevelTagType = (
  level: BudgetUsageLevel,
): "success" | "warning" | "error" => usageLevelTagTypes[level];

/**
 * Formats a date-only value for PT-BR display.
 *
 * @param value Date string in YYYY-MM-DD format.
 * @returns Localized date string.
 */
function formatDate(value: string | null): string {
  if (!value) {
    return "Sem data";
  }

  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

/**
 * Selects an envelope in the monthly review.
 *
 * @param id Budget envelope identifier.
 */
const onSelectBudget = (id: string): void => {
  selectedBudgetId.value = id;
};

/** Opens the premium upgrade modal. */
const openUpgradeModal = (): void => {
  showUpgradeModal.value = true;
};

/** Opens the create form. */
const onNewBudget = (): void => {
  if (!quotaState.value.canCreate) {
    openUpgradeModal();
    return;
  }

  editingBudget.value = null;
  formName.value = "";
  formAmount.value = null;
  formPeriod.value = "monthly";
  formTagId.value = null;
  formDateRange.value = null;
  showForm.value = true;
};

/**
 * Opens the edit form pre-filled with existing budget data.
 *
 * @param budget The budget to edit.
 */
const onEditBudget = (budget: BudgetDto): void => {
  editingBudget.value = budget;
  formName.value = budget.name;
  formAmount.value = parseCurrencyAmount(budget.amount);
  formPeriod.value = budget.period;
  formTagId.value = budget.tag_id;
  if (budget.start_date && budget.end_date) {
    formDateRange.value = [
      new Date(budget.start_date).getTime(),
      new Date(budget.end_date).getTime(),
    ];
  } else {
    formDateRange.value = null;
  }
  showForm.value = true;
};

/** Opens the edit flow focused on the selected envelope limit. */
const onAdjustSelectedLimit = (): void => {
  if (selectedBudget.value) {
    onEditBudget(selectedBudget.value);
  }
};

/** Submits the create/edit form. */
const onSubmitForm = (): void => {
  if (!formName.value || !formAmount.value) {
    return;
  }

  const payload: CreateBudgetPayload = {
    name: formName.value,
    amount: serializeCurrencyAmount(formAmount.value),
    period: formPeriod.value,
    tag_id: formTagId.value,
    start_date:
      isCustomPeriod.value && formDateRange.value
        ? new Date(formDateRange.value[0]).toISOString().split("T")[0]
        : null,
    end_date:
      isCustomPeriod.value && formDateRange.value
        ? new Date(formDateRange.value[1]).toISOString().split("T")[0]
        : null,
  };

  if (editingBudget.value) {
    updateMutation.mutate(
      { id: editingBudget.value.id, ...payload },
      {
        onSuccess: (): void => {
          showForm.value = false;
          editingBudget.value = null;
        },
      },
    );
  } else {
    createMutation.mutate(payload, {
      onSuccess: (): void => {
        showForm.value = false;
      },
    });
  }
};

/**
 * Deletes a budget by ID.
 *
 * @param id Budget ID to delete.
 */
const onDeleteBudget = (id: string): void => {
  deleteMutation.mutate(id, {
    onSuccess: (): void => {
      if (selectedBudgetId.value === id) {
        selectedBudgetId.value = null;
      }
    },
  });
};

/** Navigates to the transactions workspace for deeper review. */
const onReviewTransactions = (): void => {
  void navigateTo("/transactions");
};
</script>

<template>
  <div class="budgets-page">
    <UiInlineError
      v-if="isError"
      :title="$t('pages.budgets.loadError')"
      :message="$t('pages.budgets.loadErrorMessage')"
    />

    <template v-else>
      <section class="budgets-page__command" aria-label="Revisão mensal de envelopes">
        <div class="budgets-page__command-copy">
          <span class="budgets-page__eyebrow">
            <Sparkles :size="16" aria-hidden="true" />
            Revisão mensal de envelopes
          </span>
          <p>
            Envelopes automáticos como Streaming, Mercado ou Transporte mostram quanto do limite
            já foi comprometido pelas transações do período.
          </p>
        </div>

        <div class="budgets-page__command-actions">
          <NButton secondary type="primary" @click="onReviewTransactions">
            <template #icon>
              <ReceiptText :size="18" />
            </template>
            Revisar transações
          </NButton>
          <NButton type="primary" @click="onNewBudget">
            <template #icon>
              <Plus :size="18" />
            </template>
            Novo orçamento
          </NButton>
        </div>
      </section>

      <AiInsightSurface dimension="budgets" />

      <section
        v-if="!isLoading"
        class="budgets-page__quota"
        :class="{
          'budgets-page__quota--premium': quotaState.isPremium,
          'budgets-page__quota--locked': !quotaState.canCreate,
        }"
        aria-label="Limite de envelopes"
      >
        <div class="budgets-page__quota-icon" aria-hidden="true">
          <Crown v-if="quotaState.isPremium" :size="18" />
          <Gauge v-else :size="18" />
        </div>
        <div class="budgets-page__quota-copy">
          <strong>{{ quotaState.label }}</strong>
          <span>{{ quotaDescription }}</span>
        </div>
        <NButton
          v-if="!quotaState.isPremium"
          size="small"
          secondary
          type="primary"
          @click="openUpgradeModal"
        >
          Liberar ilimitado
        </NButton>
      </section>

      <UiPageLoader v-if="isLoading" :rows="3" />

      <UiEmptyState
        v-else-if="budgetEnvelopes.length === 0"
        class="budgets-page__empty"
        icon="pieChart"
        title="Crie seu primeiro envelope"
        description="Envelopes ajudam você a reservar um limite mensal e acompanhar o gasto comprometido automaticamente pelas transações. Comece com algo concreto, como Streaming, Mercado ou Transporte."
        action-label="Criar envelope"
        secondary-label="Ver transações"
        secondary-href="/transactions"
        @action="onNewBudget"
      >
        <template #illustration>
          <svg
            class="ui-empty-state__illustration-svg budgets-page__empty-illustration"
            viewBox="0 0 220 150"
            role="img"
            aria-label="Ilustração de orçamento vazio"
          >
            <rect
              x="34"
              y="28"
              width="152"
              height="98"
              rx="16"
              fill="var(--color-bg-elevated)"
              stroke="var(--color-outline-soft)"
              stroke-width="3"
            />
            <path
              d="M62 100V74m32 26V55m32 45V66m32 34V45"
              stroke="var(--color-brand-500)"
              stroke-width="9"
              stroke-linecap="round"
            />
            <path
              d="M58 116h104"
              stroke="var(--color-outline-hard)"
              stroke-width="5"
              stroke-linecap="round"
            />
            <circle
              cx="168"
              cy="43"
              r="18"
              fill="var(--color-positive-bg)"
              stroke="var(--color-positive)"
              stroke-width="4"
            />
            <path
              d="M160 43h16m-8-8v16"
              stroke="var(--color-positive)"
              stroke-width="4"
              stroke-linecap="round"
            />
          </svg>
        </template>
      </UiEmptyState>

      <template v-else>
        <section class="budgets-page__metrics" aria-label="Resumo dos envelopes">
          <article class="budgets-page__metric">
            <div class="budgets-page__metric-icon budgets-page__metric-icon--brand">
              <WalletCards :size="18" aria-hidden="true" />
            </div>
            <span>Total orçado</span>
            <strong>{{ formatCurrency(budgetSummary.totalBudgeted) }}</strong>
          </article>

          <article class="budgets-page__metric">
            <div class="budgets-page__metric-icon budgets-page__metric-icon--info">
              <LineChart :size="18" aria-hidden="true" />
            </div>
            <span>Comprometido</span>
            <strong>{{ formatCurrency(budgetSummary.totalSpent) }}</strong>
          </article>

          <article
            class="budgets-page__metric"
            :class="{ 'budgets-page__metric--danger': budgetSummary.totalRemaining < 0 }"
          >
            <div class="budgets-page__metric-icon budgets-page__metric-icon--positive">
              <PiggyBank :size="18" aria-hidden="true" />
            </div>
            <span>Restante</span>
            <strong>{{ formatCurrency(budgetSummary.totalRemaining) }}</strong>
          </article>

          <article
            class="budgets-page__metric"
            :class="{ 'budgets-page__metric--danger': budgetSummary.dangerCount > 0 }"
          >
            <div class="budgets-page__metric-icon budgets-page__metric-icon--warning">
              <AlertTriangle :size="18" aria-hidden="true" />
            </div>
            <span>Em risco</span>
            <strong>{{ riskEnvelopeCount }}</strong>
          </article>
        </section>

        <section class="budgets-page__health" aria-label="Saúde geral dos envelopes">
          <div class="budgets-page__health-copy">
            <CheckCircle2 v-if="budgetSummary.dangerCount === 0" :size="18" aria-hidden="true" />
            <AlertTriangle v-else :size="18" aria-hidden="true" />
            <span>{{ budgetHealthText }}</span>
          </div>
          <NProgress
            class="budgets-page__overall-progress"
            type="line"
            :percentage="budgetSummary.overallPercentage"
            :status="budgetSummary.dangerCount > 0 ? 'error' : budgetSummary.warningCount > 0 ? 'warning' : 'default'"
            :show-indicator="true"
            aria-label="Uso comprometido total dos envelopes"
          />
        </section>

        <section class="budgets-page__review-grid">
          <div class="budgets-page__envelope-list" aria-label="Lista de envelopes">
            <div class="budgets-page__list-header">
              <div>
                <span>Envelopes</span>
                <strong>{{ budgetEnvelopes.length }} ativos</strong>
              </div>
              <NTag type="info" size="small">ordenado por risco</NTag>
            </div>

            <button
              v-for="budget in sortedBudgetEnvelopes"
              :key="budget.id"
              class="budget-row"
              :class="[
                `budget-row--${budget.usageLevel}`,
                { 'budget-row--selected': selectedEnvelope?.id === budget.id },
              ]"
              type="button"
              :aria-pressed="selectedEnvelope?.id === budget.id"
              @click="onSelectBudget(budget.id)"
            >
              <span class="budget-row__accent" aria-hidden="true" />

              <span class="budget-row__main">
                <span class="budget-row__name">{{ budget.name }}</span>
                <span class="budget-row__tag">
                  <span
                    v-if="budget.tagColor"
                    class="budget-row__tag-dot"
                    :style="{ backgroundColor: budget.tagColor }"
                  />
                  <Tags v-else :size="14" aria-hidden="true" />
                  {{ budget.tagName ?? $t('pages.budgets.noCategory') }}
                </span>
              </span>

              <span class="budget-row__numbers">
                <span>
                  <strong>{{ formatCurrency(budget.spent) }}</strong>
                  <small>de {{ formatCurrency(budget.amount) }}</small>
                </span>
                <NTag :type="usageLevelTagType(budget.usageLevel)" size="small">
                  {{ usageLevelLabel(budget.usageLevel) }}
                </NTag>
              </span>

              <span class="budget-row__progress">
                <NProgress
                  type="line"
                  :aria-label="`Uso comprometido do envelope ${budget.name}`"
                  :percentage="budget.progressPercentage"
                  :status="budget.progressStatus"
                  :show-indicator="false"
                />
                <span>{{ budget.displayPercentage }}%</span>
              </span>

              <span
                class="budget-row__remaining"
                :class="{ 'budget-row__remaining--negative': budget.remaining < 0 }"
              >
                {{ formatCurrency(budget.remaining) }}
              </span>
            </button>
          </div>

          <aside class="budgets-page__detail-panel" aria-label="Detalhe do envelope selecionado">
            <template v-if="selectedEnvelope">
              <div class="detail-panel__header">
                <div>
                  <span class="detail-panel__eyebrow">
                    <BarChart3 :size="16" aria-hidden="true" />
                    Envelope selecionado
                  </span>
                  <h2>{{ selectedEnvelope.name }}</h2>
                </div>
                <NTag :type="usageLevelTagType(selectedEnvelope.usageLevel)">
                  {{ usageLevelLabel(selectedEnvelope.usageLevel) }}
                </NTag>
              </div>

              <div class="detail-panel__hero">
                <div class="detail-panel__hero-copy">
                  <span>Comprometido</span>
                  <strong>{{ formatCurrency(selectedEnvelope.spent) }}</strong>
                  <small>Limite de {{ formatCurrency(selectedEnvelope.amount) }}</small>
                </div>
                <div
                  class="detail-panel__orb"
                  :class="`detail-panel__orb--${selectedEnvelope.usageLevel}`"
                  aria-hidden="true"
                >
                  {{ selectedEnvelope.displayPercentage }}%
                </div>
              </div>

              <NProgress
                type="line"
                :aria-label="`Uso comprometido do envelope ${selectedEnvelope.name}`"
                :percentage="selectedEnvelope.progressPercentage"
                :status="selectedEnvelope.progressStatus"
                :show-indicator="false"
              />

              <div class="detail-panel__facts">
                <article>
                  <CalendarDays :size="17" aria-hidden="true" />
                  <span>Período</span>
                  <strong>{{ selectedPeriodLabel }}</strong>
                </article>
                <article>
                  <Tags :size="17" aria-hidden="true" />
                  <span>Origem</span>
                  <strong>{{ selectedEnvelope.tagName ?? 'Todas as transações' }}</strong>
                </article>
                <article>
                  <SlidersHorizontal :size="17" aria-hidden="true" />
                  <span>Restante</span>
                  <strong>{{ formatCurrency(selectedEnvelope.remaining) }}</strong>
                </article>
              </div>

              <div
                class="detail-panel__diagnosis"
                :class="`detail-panel__diagnosis--${selectedEnvelope.usageLevel}`"
              >
                <AlertTriangle
                  v-if="selectedEnvelope.usageLevel !== 'healthy'"
                  :size="18"
                  aria-hidden="true"
                />
                <CheckCircle2 v-else :size="18" aria-hidden="true" />
                <p>{{ selectedDiagnosis }}</p>
              </div>

              <div class="detail-panel__actions">
                <NButton type="primary" @click="onReviewTransactions">
                  <template #icon>
                    <FileSearch :size="18" />
                  </template>
                  Revisar transações
                </NButton>
                <NButton secondary @click="onAdjustSelectedLimit">
                  Ajustar limite
                </NButton>
                <NButton secondary @click="onEditBudget(selectedEnvelope.raw)">
                  Editar
                </NButton>
                <NPopconfirm @positive-click="onDeleteBudget(selectedEnvelope.id)">
                  <template #trigger>
                    <NButton secondary type="error">
                      Excluir
                    </NButton>
                  </template>
                  {{ $t('pages.budgets.deleteConfirm') }}
                </NPopconfirm>
              </div>

              <section class="detail-panel__transactions" aria-label="Prévia de transações">
                <div class="detail-panel__transactions-head">
                  <div>
                    <span>Transações do período</span>
                    <strong>Prévia operacional</strong>
                  </div>
                  <NButton size="small" text type="primary" @click="onReviewTransactions">
                    Abrir
                    <template #icon>
                      <ArrowUpRight :size="15" />
                    </template>
                  </NButton>
                </div>

                <UiPageLoader
                  v-if="isTransactionPreviewLoading"
                  class="detail-panel__transactions-loader"
                  :rows="2"
                />

                <UiInlineError
                  v-else-if="isTransactionPreviewError"
                  title="Não foi possível carregar a prévia"
                  message="A lista principal de envelopes segue disponível. Use Transações para investigar o período."
                />

                <div v-else-if="previewTransactions.length === 0" class="detail-panel__transactions-empty">
                  Nenhuma despesa comprometida apareceu na prévia deste período.
                </div>

                <ul v-else class="detail-panel__transaction-list">
                  <li v-for="transaction in previewTransactions" :key="transaction.id">
                    <span>
                      <strong>{{ transaction.title }}</strong>
                      <small>{{ formatDate(transaction.due_date) }} · {{ transaction.status }}</small>
                    </span>
                    <b>{{ formatCurrency(parseCurrencyAmount(transaction.amount)) }}</b>
                  </li>
                </ul>
              </section>
            </template>
          </aside>
        </section>
      </template>
    </template>

    <NModal
      v-model:show="showForm"
      class="budget-envelope-modal"
      preset="card"
      :title="editingBudget ? 'Editar envelope' : 'Novo envelope'"
      style="max-width: 520px"
      :mask-closable="true"
      @after-leave="editingBudget = null"
    >
      <NForm label-placement="top">
        <NFormItem label="Nome do envelope">
          <NInput v-model:value="formName" placeholder="Ex.: Streaming e apps" />
        </NFormItem>

        <NFormItem label="Limite do período">
          <UiMoneyInput v-model:value="formAmount" :min="0.01" />
        </NFormItem>

        <NFormItem :label="$t('pages.budgets.form.period')">
          <NSelect v-model:value="formPeriod" :options="periodOptions" />
        </NFormItem>

        <NFormItem v-if="isCustomPeriod" :label="$t('pages.budgets.form.startDate')">
          <NDatePicker
            v-model:value="formDateRange"
            type="daterange"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="Envelope / tag">
          <NSelect
            v-model:value="formTagId"
            :options="tagOptions"
            placeholder="Selecione a tag que alimenta este envelope"
            clearable
          />
        </NFormItem>

        <NSpace justify="end">
          <NButton @click="showForm = false">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="createMutation.isPending.value || updateMutation.isPending.value"
            @click="onSubmitForm"
          >
            {{ editingBudget ? 'Salvar' : 'Criar envelope' }}
          </NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal
      v-model:show="showUpgradeModal"
      preset="card"
      title="Orçamentos ilimitados"
      style="max-width: 440px"
      :mask-closable="true"
    >
      <UiUpgradePrompt
        feature-name="Premium"
        description="Você já usou os 3 envelopes do plano gratuito. Assine Premium para criar envelopes ilimitados, separar categorias com mais precisão e acompanhar alertas por área de gasto."
        cta-label="Ver plano Premium"
        to="/subscription"
      />
    </NModal>
  </div>
</template>

<style scoped>
.budgets-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.budgets-page__command {
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

.budgets-page__command-copy {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.budgets-page__eyebrow,
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

.budgets-page__command-copy p {
  max-width: 760px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

.budgets-page__command-actions,
.detail-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.budgets-page__quota {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 55%),
    var(--color-bg-elevated);
}

.budgets-page__quota--premium {
  background:
    linear-gradient(135deg, var(--color-warning-bg), transparent 60%),
    var(--color-bg-elevated);
}

.budgets-page__quota--locked {
  border-color: color-mix(in srgb, var(--color-warning) 42%, transparent);
}

.budgets-page__quota-icon,
.budgets-page__metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.budgets-page__quota-icon {
  width: 40px;
  height: 40px;
  color: var(--color-brand-600);
  background: var(--color-brand-hover-surface);
}

.budgets-page__quota--premium .budgets-page__quota-icon {
  color: var(--color-warning-dark);
  background: var(--color-warning-bg);
}

.budgets-page__quota-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.budgets-page__quota-copy strong,
.budgets-page__list-header strong,
.detail-panel__transactions-head strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.budgets-page__quota-copy span,
.detail-panel__transactions-head span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.budgets-page__empty {
  min-height: 420px;
  padding: var(--space-5) 0;
  border: 1px dashed color-mix(in srgb, var(--color-brand-500) 34%, transparent);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 44%),
    color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
}

.budgets-page__empty-illustration {
  filter: drop-shadow(0 18px 42px var(--color-brand-glow-xs));
}

.budgets-page__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.budgets-page__metric {
  display: grid;
  gap: var(--space-2);
  min-height: 132px;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  box-shadow: var(--shadow-card);
}

.budgets-page__metric span,
.detail-panel__facts span,
.detail-panel__hero-copy span,
.budget-row__tag,
.budget-row__numbers small {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.budgets-page__metric strong {
  align-self: end;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  line-height: 1.15;
}

.budgets-page__metric--danger strong {
  color: var(--color-negative);
}

.budgets-page__metric-icon {
  width: 38px;
  height: 38px;
}

.budgets-page__metric-icon--brand {
  color: var(--color-brand-500);
  background: var(--color-brand-hover-surface);
}

.budgets-page__metric-icon--info {
  color: var(--color-info);
  background: var(--color-info-bg);
}

.budgets-page__metric-icon--positive {
  color: var(--color-positive);
  background: var(--color-positive-bg);
}

.budgets-page__metric-icon--warning {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.budgets-page__health {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.budgets-page__health-copy {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.budgets-page__review-grid {
  display: grid;
  grid-template-columns: minmax(420px, 1.1fr) minmax(360px, 0.9fr);
  gap: var(--space-4);
  align-items: start;
}

.budgets-page__envelope-list,
.budgets-page__detail-panel {
  min-width: 0;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-card);
}

.budgets-page__envelope-list {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
}

.budgets-page__list-header,
.detail-panel__header,
.detail-panel__transactions-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.budgets-page__list-header > div,
.detail-panel__transactions-head > div {
  display: grid;
  gap: 3px;
}

.budgets-page__list-header span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.budget-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(210px, 0.75fr);
  gap: var(--space-2) var(--space-3);
  width: 100%;
  padding: var(--space-3);
  overflow: hidden;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--motion-fast),
    box-shadow var(--motion-fast),
    transform var(--motion-fast);
}

.budget-row:hover,
.budget-row--selected {
  border-color: color-mix(in srgb, var(--color-brand-500) 38%, var(--color-outline-soft));
  box-shadow: 0 0 0 3px var(--color-brand-glow-2xs);
  transform: translateY(-1px);
}

.budget-row__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--color-positive);
}

.budget-row--warning .budget-row__accent {
  background: var(--color-warning);
}

.budget-row--danger .budget-row__accent {
  background: var(--color-negative);
}

.budget-row__main,
.budget-row__numbers,
.budget-row__progress {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.budget-row__name {
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
}

.budget-row__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.budget-row__tag-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}

.budget-row__numbers {
  justify-items: end;
  text-align: right;
}

.budget-row__numbers strong,
.budget-row__remaining,
.detail-panel__hero-copy strong,
.detail-panel__facts strong,
.detail-panel__orb,
.detail-panel__transaction-list b {
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.budget-row__numbers small {
  display: block;
  margin-top: 3px;
}

.budget-row__progress {
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.budget-row__progress span {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.budget-row__remaining {
  grid-column: 1 / -1;
  justify-self: end;
  color: var(--color-positive);
  font-size: var(--font-size-sm);
}

.budget-row__remaining--negative {
  color: var(--color-negative);
}

.budgets-page__detail-panel {
  position: sticky;
  top: var(--space-4);
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
}

.detail-panel__header h2 {
  margin: 5px 0 0;
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  line-height: 1.05;
}

.detail-panel__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 52%),
    var(--color-bg-surface);
}

.detail-panel__hero-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.detail-panel__hero-copy strong {
  overflow-wrap: anywhere;
  font-size: var(--font-size-2xl);
  line-height: 1.05;
}

.detail-panel__hero-copy small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-panel__orb {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-full);
  background: var(--color-positive-bg);
  color: var(--color-positive);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
}

.detail-panel__orb--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.detail-panel__orb--danger {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}

.detail-panel__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.detail-panel__facts article {
  display: grid;
  gap: 7px;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.detail-panel__facts svg {
  color: var(--color-brand-500);
}

.detail-panel__facts strong {
  overflow-wrap: anywhere;
  font-size: var(--font-size-sm);
  line-height: 1.25;
}

.detail-panel__diagnosis {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3);
  border: 1px solid var(--color-positive-border);
  border-radius: var(--radius-md);
  background: var(--color-positive-bg);
  color: var(--color-positive);
}

.detail-panel__diagnosis--warning {
  border-color: color-mix(in srgb, var(--color-warning) 28%, transparent);
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.detail-panel__diagnosis--danger {
  border-color: var(--color-negative-border);
  background: var(--color-negative-bg);
  color: var(--color-negative);
}

.detail-panel__diagnosis p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

.detail-panel__actions {
  justify-content: flex-start;
}

.detail-panel__transactions {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
}

.detail-panel__transactions-loader {
  padding: var(--space-2);
}

.detail-panel__transactions-empty {
  padding: var(--space-3);
  border: 1px dashed var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.detail-panel__transaction-list {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.detail-panel__transaction-list li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.detail-panel__transaction-list span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.detail-panel__transaction-list strong {
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.detail-panel__transaction-list small {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.detail-panel__transaction-list b {
  white-space: nowrap;
  font-size: var(--font-size-sm);
}

:global(.budget-envelope-modal .n-card) {
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
}

:global(.budget-envelope-modal .n-card__content) {
  overflow: auto;
}

@media (max-width: 1180px) {
  .budgets-page__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .budgets-page__review-grid {
    grid-template-columns: 1fr;
  }

  .budgets-page__detail-panel {
    position: static;
  }
}

@media (max-width: 720px) {
  .budgets-page {
    padding: var(--space-3);
  }

  .budgets-page__command,
  .budgets-page__quota,
  .detail-panel__hero {
    grid-template-columns: 1fr;
  }

  .budgets-page__command,
  .detail-panel__header {
    flex-direction: column;
    align-items: stretch;
  }

  .budgets-page__command-actions,
  .detail-panel__actions {
    justify-content: stretch;
  }

  .budgets-page__command-actions :deep(.n-button),
  .detail-panel__actions :deep(.n-button) {
    width: 100%;
  }

  .budgets-page__metrics,
  .detail-panel__facts {
    grid-template-columns: 1fr;
  }

  .budget-row {
    grid-template-columns: 1fr;
  }

  .budget-row__numbers {
    justify-items: start;
    text-align: left;
  }

  .detail-panel__orb {
    width: 78px;
    height: 78px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .budget-row {
    transition: none;
  }

  .budget-row:hover,
  .budget-row--selected {
    transform: none;
  }
}
</style>
