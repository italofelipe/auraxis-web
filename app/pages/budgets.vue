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
  NInputNumber,
  NSelect,
  NDatePicker,
  NStatistic,
  NEmpty,
  NSpace,
} from "naive-ui";
import { useBudgetsQuery } from "~/features/budgets/queries/use-budgets-query";
import { useCreateBudgetMutation } from "~/features/budgets/queries/use-create-budget-mutation";
import { useUpdateBudgetMutation } from "~/features/budgets/queries/use-update-budget-mutation";
import { useDeleteBudgetMutation } from "~/features/budgets/queries/use-delete-budget-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import type { BudgetDto, CreateBudgetPayload, BudgetPeriod } from "~/features/budgets/contracts/budget.contracts";

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
const createMutation = useCreateBudgetMutation();
const updateMutation = useUpdateBudgetMutation();
const deleteMutation = useDeleteBudgetMutation();

// --- form state ---
const showForm = ref<boolean>(false);
const editingBudget = ref<BudgetDto | null>(null);
const formName = ref<string>("");
const formAmount = ref<number | null>(null);
const formPeriod = ref<BudgetPeriod>("monthly");
const formTagId = ref<string | null>(null);
const formDateRange = ref<[number, number] | null>(null);

// --- computed ---
const allBudgets = computed(() => budgets.value ?? []);

const totalBudgeted = computed(() =>
  allBudgets.value.reduce((sum, b) => sum + parseFloat(b.amount), 0),
);

const totalSpent = computed(() =>
  allBudgets.value.reduce((sum, b) => sum + parseFloat(b.spent), 0),
);

const totalRemaining = computed(() => totalBudgeted.value - totalSpent.value);

const overallPercentage = computed(() =>
  totalBudgeted.value > 0
    ? Math.min(Math.round((totalSpent.value / totalBudgeted.value) * 100), 100)
    : 0,
);

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

// --- helpers ---

/**
 * Formats a decimal string as BRL currency display.
 *
 * @param value - Decimal string from API.
 * @returns Formatted currency string.
 */
const formatCurrency = (value: string): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));
};

/**
 * Returns the progress bar color based on percentage used.
 *
 * @param pct - Percentage used (0-100+).
 * @returns Naive UI status string.
 */
const progressStatus = (pct: number): "default" | "warning" | "error" => {
  if (pct >= 100) {return "error";}
  if (pct >= 80) {return "warning";}
  return "default";
};

/**
 * Returns a safe 0-100 clamped percentage for the NProgress display.
 *
 * @param pct - Raw percentage (may exceed 100).
 * @returns Clamped integer.
 */
const clampedPct = (pct: number): number => Math.min(Math.round(pct), 100);

// --- actions ---

/** Opens the create form. */
const onNewBudget = (): void => {
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
  formAmount.value = parseFloat(budget.amount);
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
    amount: formAmount.value.toFixed(2),
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
      <!-- Summary bar -->
      <NCard v-if="allBudgets.length > 0" class="budgets-page__summary-card" :bordered="true">
        <div class="budgets-page__summary-stats">
          <NStatistic
            :label="$t('pages.budgets.summary.budgeted')"
            :value="formatCurrency(String(totalBudgeted))"
          />
          <NStatistic
            :label="$t('pages.budgets.summary.spent')"
            :value="formatCurrency(String(totalSpent))"
          />
          <NStatistic
            :label="$t('pages.budgets.summary.remaining')"
            :value="formatCurrency(String(totalRemaining))"
          />
        </div>
        <NProgress
          class="budgets-page__overall-progress"
          type="line"
          :percentage="overallPercentage"
          :status="progressStatus(overallPercentage)"
          :show-indicator="true"
        />
      </NCard>

      <!-- Loading -->
      <UiPageLoader v-if="isLoading" :rows="3" />

      <!-- Empty state -->
      <NEmpty
        v-else-if="allBudgets.length === 0"
        class="budgets-page__empty"
        :description="$t('pages.budgets.emptyState')"
      >
        <template #extra>
          <NButton type="primary" @click="onNewBudget">
            {{ $t('pages.budgets.newBudget') }}
          </NButton>
        </template>
      </NEmpty>

      <!-- Budget cards -->
      <div v-else class="budgets-page__grid">
        <NCard
          v-for="budget in allBudgets"
          :key="budget.id"
          class="budgets-page__budget-card"
          :bordered="true"
        >
          <div class="budget-card__top">
            <div class="budget-card__tag-info">
              <span
                v-if="budget.tag_color"
                class="budget-card__tag-dot"
                :style="{ backgroundColor: budget.tag_color }"
              />
              <span class="budget-card__tag-name">
                {{
                  budget.tag_name ?? $t('pages.budgets.noCategory')
                }}
              </span>
            </div>
            <NTag v-if="budget.is_over_budget" type="error" size="small">
              {{ $t('pages.budgets.overBudget') }}
            </NTag>
          </div>

          <div class="budget-card__name">{{ budget.name }}</div>

          <NProgress
            class="budget-card__progress"
            type="line"
            :percentage="clampedPct(budget.percentage_used)"
            :status="progressStatus(budget.percentage_used)"
            :show-indicator="false"
          />

          <div class="budget-card__amounts">
            <span class="budget-card__spent">
              {{ formatCurrency(budget.spent) }} / {{ formatCurrency(budget.amount) }}
            </span>
            <span class="budget-card__pct">{{ Math.round(budget.percentage_used) }}%</span>
          </div>

          <div class="budget-card__remaining">
            {{ $t('pages.budgets.summary.remaining') }}: {{ formatCurrency(budget.remaining) }}
          </div>

          <div class="budget-card__actions">
            <NButton size="small" @click="onEditBudget(budget)">Editar</NButton>
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
          <NInputNumber
            v-model:value="formAmount"
            :min="0.01"
            :precision="2"
            style="width: 100%"
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
  </div>
</template>

<style scoped>
.budgets-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
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

.budgets-page__summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.budgets-page__overall-progress {
  margin-top: var(--space-2);
}

.budgets-page__empty {
  padding: var(--space-5) 0;
}

.budgets-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
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
  .budgets-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
