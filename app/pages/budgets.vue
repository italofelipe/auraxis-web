<script setup lang="ts">
import {
  NButton,
  NCard,
  NProgress,
  NTag,
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NStatistic,
  NSpace,
} from "naive-ui";
import { AlertTriangle, CheckCircle2, Crown, Gauge } from "lucide-vue-next";
import { useBudgetsQuery } from "~/features/budgets/queries/use-budgets-query";
import { useCreateBudgetMutation } from "~/features/budgets/queries/use-create-budget-mutation";
import { useUpdateBudgetMutation } from "~/features/budgets/queries/use-update-budget-mutation";
import { useDeleteBudgetMutation } from "~/features/budgets/queries/use-delete-budget-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import type { BudgetDto, CreateBudgetPayload, BudgetPeriod } from "~/features/budgets/contracts/budget.contracts";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import {
  buildBudgetQuotaState,
  normalizeBudgetEnvelope,
  summarizeBudgetEnvelopes,
  type BudgetUsageLevel,
} from "~/features/budgets/model/budget-envelope";
import { formatCurrency } from "~/utils/currency";
import { parseCurrencyAmount, serializeCurrencyAmount } from "~/utils/currencyInput";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Orçamentos",
  pageSubtitle: "Controle seus gastos por categoria e período",
});

useHead({ title: "Orçamentos | Auraxis" });

// --- queries ---
const { data: budgets, isLoading, isError } = useBudgetsQuery();
const { data: tags } = useTagsQuery();
const { data: subscription } = useSubscriptionQuery();
const createMutation = useCreateBudgetMutation();
const updateMutation = useUpdateBudgetMutation();
const deleteMutation = useDeleteBudgetMutation();

// --- form state ---
const showForm = ref<boolean>(false);
const showUpgradeModal = ref<boolean>(false);
const editingBudget = ref<BudgetDto | null>(null);
const formName = ref<string>("");
const formAmount = ref<number | null>(null);
const formPeriod = ref<BudgetPeriod>("monthly");
const formTagId = ref<string | null>(null);
const formDateRange = ref<[number, number] | null>(null);

// --- computed ---
const allBudgets = computed(() => budgets.value ?? []);

const budgetEnvelopes = computed(() =>
  allBudgets.value.map(normalizeBudgetEnvelope),
);

const budgetSummary = computed(() => summarizeBudgetEnvelopes(budgetEnvelopes.value));

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

const budgetHealthText = computed(() => {
  if (budgetSummary.value.dangerCount > 0) {
    return `${budgetSummary.value.dangerCount} orçamento(s) acima do limite`;
  }

  if (budgetSummary.value.warningCount > 0) {
    return `${budgetSummary.value.warningCount} orçamento(s) pedem atenção`;
  }

  return "Todos os orçamentos estão dentro do limite";
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

/** Opens the premium upgrade modal. */
const openUpgradeModal = (): void => {
  showUpgradeModal.value = true;
};

// --- actions ---

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
 * @param budget - The budget to edit.
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

/** Submits the create/edit form. */
const onSubmitForm = (): void => {
  if (!formName.value || !formAmount.value) {return;}

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
 * @param id - The budget ID to delete.
 */
const onDeleteBudget = (id: string): void => {
  deleteMutation.mutate(id);
};
</script>

<template>
  <div class="budgets-page">
    <!-- Header -->
    <div class="budgets-page__header">
      <div class="budgets-page__title-block">
        <span class="budgets-page__title">{{ $t('pages.budgets.title') }}</span>
        <span class="budgets-page__subtitle">
          Defina limites por categoria, acompanhe o uso e receba alertas antes de estourar o mês.
        </span>
      </div>
      <NButton type="primary" size="medium" @click="onNewBudget">
        {{ $t('pages.budgets.newBudget') }}
      </NButton>
    </div>

    <!-- Error state -->
    <UiInlineError
      v-if="isError"
      :title="$t('pages.budgets.loadError')"
      :message="$t('pages.budgets.loadErrorMessage')"
    />

    <template v-else>
      <AiInsightSurface dimension="budgets" />

      <section
        v-if="!isLoading"
        class="budgets-page__quota"
        :class="{
          'budgets-page__quota--premium': quotaState.isPremium,
          'budgets-page__quota--locked': !quotaState.canCreate,
        }"
        aria-label="Limite de orçamentos"
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

      <!-- Summary bar -->
      <NCard v-if="budgetEnvelopes.length > 0" class="budgets-page__summary-card" :bordered="true">
        <div class="budgets-page__summary-stats">
          <NStatistic
            :label="$t('pages.budgets.summary.budgeted')"
            :value="formatCurrency(budgetSummary.totalBudgeted)"
          />
          <NStatistic
            :label="$t('pages.budgets.summary.spent')"
            :value="formatCurrency(budgetSummary.totalSpent)"
          />
          <NStatistic
            :label="$t('pages.budgets.summary.remaining')"
            :value="formatCurrency(budgetSummary.totalRemaining)"
          />
        </div>
        <div class="budgets-page__health-row">
          <span class="budgets-page__health-item">
            <CheckCircle2 :size="16" aria-hidden="true" />
            {{ budgetHealthText }}
          </span>
          <span v-if="budgetSummary.warningCount > 0" class="budgets-page__health-item budgets-page__health-item--warning">
            <AlertTriangle :size="16" aria-hidden="true" />
            {{ budgetSummary.warningCount }} perto do limite
          </span>
          <span v-if="budgetSummary.dangerCount > 0" class="budgets-page__health-item budgets-page__health-item--danger">
            <AlertTriangle :size="16" aria-hidden="true" />
            {{ budgetSummary.dangerCount }} estourado(s)
          </span>
        </div>
        <NProgress
          class="budgets-page__overall-progress"
          type="line"
          :percentage="budgetSummary.overallPercentage"
          :status="budgetSummary.dangerCount > 0 ? 'error' : budgetSummary.warningCount > 0 ? 'warning' : 'default'"
          :show-indicator="true"
          aria-label="Uso total dos orçamentos"
        />
      </NCard>

      <!-- Loading -->
      <UiPageLoader v-if="isLoading" :rows="3" />

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="budgetEnvelopes.length === 0"
        class="budgets-page__empty"
        icon="pieChart"
        title="Crie seu primeiro orçamento"
        description="Orçamentos ajudam você a definir um limite por categoria, acompanhar quanto já foi usado e perceber desvios antes que o mês aperte. Comece por uma categoria simples, como mercado, moradia ou lazer."
        action-label="Criar orçamento"
        secondary-label="Ver transações"
        secondary-href="/transactions"
        @action="onNewBudget"
      >
        <template #illustration>
          <svg class="ui-empty-state__illustration-svg" viewBox="0 0 220 150" role="img" aria-label="Ilustração de orçamento vazio">
            <rect x="34" y="28" width="152" height="98" rx="16" fill="var(--color-bg-elevated)" stroke="var(--color-outline-soft)" stroke-width="3" />
            <path d="M62 100V74m32 26V55m32 45V66m32 34V45" stroke="var(--color-brand-500)" stroke-width="9" stroke-linecap="round" />
            <path d="M58 116h104" stroke="var(--color-outline-hard)" stroke-width="5" stroke-linecap="round" />
            <circle cx="168" cy="43" r="18" fill="var(--color-positive-bg)" stroke="var(--color-positive)" stroke-width="4" />
            <path d="M160 43h16m-8-8v16" stroke="var(--color-positive)" stroke-width="4" stroke-linecap="round" />
          </svg>
        </template>
      </UiEmptyState>

      <!-- Budget cards -->
      <div v-else class="budgets-page__grid">
        <NCard
          v-for="budget in budgetEnvelopes"
          :key="budget.id"
          class="budgets-page__budget-card"
          :class="`budgets-page__budget-card--${budget.usageLevel}`"
          :bordered="true"
        >
          <div class="budget-card__top">
            <div class="budget-card__tag-info">
              <span
                v-if="budget.tagColor"
                class="budget-card__tag-dot"
                :style="{ backgroundColor: budget.tagColor }"
              />
              <span class="budget-card__tag-name">
                {{
                  budget.tagName ?? $t('pages.budgets.noCategory')
                }}
              </span>
            </div>
            <NTag :type="usageLevelTagType(budget.usageLevel)" size="small">
              {{ usageLevelLabel(budget.usageLevel) }}
            </NTag>
          </div>

          <div class="budget-card__name">{{ budget.name }}</div>

          <NProgress
            class="budget-card__progress"
            type="line"
            :aria-label="`Uso do orçamento ${budget.name}`"
            :percentage="budget.progressPercentage"
            :status="budget.progressStatus"
            :show-indicator="false"
          />

          <div class="budget-card__amounts">
            <span class="budget-card__spent">
              {{ formatCurrency(budget.spent) }} / {{ formatCurrency(budget.amount) }}
            </span>
            <span class="budget-card__pct">{{ budget.displayPercentage }}%</span>
          </div>

          <div class="budget-card__remaining">
            {{ $t('pages.budgets.summary.remaining') }}: {{ formatCurrency(budget.remaining) }}
          </div>

          <div class="budget-card__actions">
            <NButton size="small" @click="onEditBudget(budget.raw)">Editar</NButton>
            <NPopconfirm @positive-click="onDeleteBudget(budget.id)">
              <template #trigger>
                <NButton size="small" type="error">Excluir</NButton>
              </template>
              {{ $t('pages.budgets.deleteConfirm') }}
            </NPopconfirm>
          </div>
        </NCard>
      </div>
    </template>

    <!-- Create/Edit modal -->
    <NModal
      v-model:show="showForm"
      preset="card"
      :title="editingBudget ? 'Editar orçamento' : $t('pages.budgets.newBudget')"
      style="max-width: 480px"
      :mask-closable="true"
      @after-leave="editingBudget = null"
    >
      <NForm label-placement="top">
        <NFormItem :label="$t('pages.budgets.form.name')">
          <NInput v-model:value="formName" :placeholder="$t('pages.budgets.form.name')" />
        </NFormItem>

        <NFormItem :label="$t('pages.budgets.form.amount')">
          <UiMoneyInput
            v-model:value="formAmount"
            :min="0.01"
          />
        </NFormItem>

        <NFormItem :label="$t('pages.budgets.form.period')">
          <NSelect
            v-model:value="formPeriod"
            :options="periodOptions"
          />
        </NFormItem>

        <NFormItem v-if="isCustomPeriod" :label="$t('pages.budgets.form.startDate')">
          <NDatePicker
            v-model:value="formDateRange"
            type="daterange"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem :label="$t('pages.budgets.form.tag')">
          <NSelect
            v-model:value="formTagId"
            :options="tagOptions"
            :placeholder="$t('pages.budgets.form.tagPlaceholder')"
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
            {{ editingBudget ? 'Salvar' : 'Criar' }}
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
        description="Você já usou os 3 envelopes do plano gratuito. Assine Premium para criar orçamentos ilimitados, separar categorias com mais precisão e acompanhar alertas por área de gasto."
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

.budgets-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.budgets-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.budgets-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.budgets-page__subtitle {
  max-width: 680px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.budgets-page__quota {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg, 16px);
  background:
    linear-gradient(135deg, rgb(45 212 191 / 10%), transparent 55%),
    var(--color-bg-elevated);
}

.budgets-page__quota--premium {
  background:
    linear-gradient(135deg, rgb(251 191 36 / 12%), transparent 60%),
    var(--color-bg-elevated);
}

.budgets-page__quota--locked {
  border-color: color-mix(in srgb, var(--color-warning) 42%, transparent);
}

.budgets-page__quota-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
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

.budgets-page__quota-copy strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.budgets-page__quota-copy span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.budgets-page__summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.budgets-page__health-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.budgets-page__health-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-positive-dark, #066b4d);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium, 500);
}

.budgets-page__health-item--warning {
  color: var(--color-warning-text, #8e5e13);
}

.budgets-page__health-item--danger {
  color: var(--color-negative-dark, #9f303c);
}

:global(:root[data-theme="dark"]) .budgets-page__health-item {
  color: var(--color-positive);
}

:global(:root[data-theme="dark"]) .budgets-page__health-item--warning {
  color: var(--color-warning-text);
}

:global(:root[data-theme="dark"]) .budgets-page__health-item--danger {
  color: var(--color-negative);
}

.budgets-page__overall-progress {
  margin-top: var(--space-2);
}

.budgets-page__empty {
  padding: var(--space-5) 0;
}

.budgets-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.budgets-page__budget-card {
  position: relative;
  overflow: hidden;
}

.budgets-page__budget-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--color-positive);
}

.budgets-page__budget-card--warning::before {
  background: var(--color-warning, #f59e0b);
}

.budgets-page__budget-card--danger::before {
  background: var(--color-danger, #ef4444);
}

.budget-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.budget-card__tag-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.budget-card__tag-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.budget-card__tag-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.budget-card__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
}

.budget-card__progress {
  margin-bottom: var(--space-1);
}

.budget-card__amounts {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.budget-card__remaining {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.budget-card__actions {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .budgets-page {
    padding: var(--space-3);
  }

  .budgets-page__quota {
    grid-template-columns: 1fr;
  }

  .budgets-page__summary-stats {
    grid-template-columns: 1fr;
  }

  .budgets-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
