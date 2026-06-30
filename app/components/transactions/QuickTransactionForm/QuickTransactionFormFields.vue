<script setup lang="ts">
import { computed, inject } from "vue";
import {
  NDatePicker,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  type SelectOption,
} from "naive-ui";

import PreviewInstallments from "./PreviewInstallments.vue";
import {
  QUICK_TRANSACTION_FORM_KEY,
  type QuickTransactionFormState,
} from "./useQuickTransactionForm";
import type { BudgetImpactPreview } from "~/features/budgets/model/budget-impact-preview";
import {
  previewInstallments,
  type InstallmentPreview,
} from "~/features/transactions/utils/preview-installments";
import { formatCurrency } from "~/utils/currency";

defineOptions({ name: "QuickTransactionFormFields" });

defineProps<{
  tagOptions: SelectOption[];
  accountOptions: SelectOption[];
  creditCardOptions: SelectOption[];
  statusOptions: SelectOption[];
  showCreditCard: boolean;
  lockCreditCard: boolean;
  showInstallment: boolean;
  showInstallmentCount: boolean;
  showEndDate: boolean;
  showRecurrenceCadence: boolean;
  budgetImpactPreview: BudgetImpactPreview | null;
  recurrenceUnitOptions: SelectOption[];
  recurringDisabled: boolean;
}>();

const form = inject<QuickTransactionFormState>(QUICK_TRANSACTION_FORM_KEY)!;

const installmentPreview = computed<InstallmentPreview | null>(() => {
  if (
    !form.is_installment ||
    form.amount === null ||
    form.amount <= 0 ||
    form.installment_count === null ||
    form.installment_count < 2 ||
    form.due_date === null
  ) {
    return null;
  }
  return previewInstallments(
    form.amount,
    form.installment_count,
    new Date(form.due_date),
  );
});
</script>

<template>
  <div class="quick-transaction-form-fields">
    <NFormItem :label="$t('transaction.form.title.label')" path="title">
      <NInput v-model:value="form.title" :placeholder="$t('transaction.form.title.placeholder')" />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.amount.label')" path="amount">
      <UiMoneyInput
        v-model:value="form.amount"
        :placeholder="$t('transaction.form.amount.placeholder')"
        :min="0.01"
      />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.dueDate.label')" path="due_date">
      <NDatePicker v-model:value="form.due_date" type="date" format="dd/MM/yyyy" style="width: 100%" />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.tag.label')" path="tag_id">
      <NSelect
        v-model:value="form.tag_id"
        :options="tagOptions"
        :placeholder="$t('transaction.form.tag.placeholder')"
        clearable
      />
      <template v-if="tagOptions.length === 0">
        <NuxtLink to="/settings/tags" class="quick-transaction-form__settings-link">
          {{ $t('transaction.form.tag.createHint') }}
        </NuxtLink>
      </template>
      <div
        v-if="budgetImpactPreview"
        class="quick-transaction-form__budget-preview"
        :class="{ 'quick-transaction-form__budget-preview--danger': budgetImpactPreview.isOverBudget }"
      >
        <strong>{{ budgetImpactPreview.budgetName }}</strong>
        ficará em
        <strong>{{ formatCurrency(budgetImpactPreview.projectedSpent) }}</strong>
        de
        <strong>{{ formatCurrency(budgetImpactPreview.limitAmount) }}</strong>
        com esta transação.
      </div>
    </NFormItem>

    <NFormItem :label="$t('transaction.form.account.label')" path="account_id">
      <NSelect
        v-model:value="form.account_id"
        :options="accountOptions"
        :placeholder="$t('transaction.form.account.placeholder')"
        clearable
      />
      <template v-if="accountOptions.length === 0">
        <NuxtLink to="/settings/accounts" class="quick-transaction-form__settings-link">
          {{ $t('transaction.form.account.createHint') }}
        </NuxtLink>
      </template>
    </NFormItem>

    <NFormItem v-if="showCreditCard" :label="$t('transaction.form.creditCard.label')" path="credit_card_id">
      <NSelect
        v-model:value="form.credit_card_id"
        :options="creditCardOptions"
        :placeholder="$t('transaction.form.creditCard.placeholder')"
        :disabled="lockCreditCard"
        :clearable="!lockCreditCard"
      />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.status.label')" path="status">
      <NSelect v-model:value="form.status" :options="statusOptions" />
    </NFormItem>

    <NFormItem v-if="showInstallment" :label="$t('transaction.form.installment.label')" path="is_installment">
      <NSwitch v-model:value="form.is_installment" />
    </NFormItem>

    <NFormItem
      v-if="showInstallmentCount"
      :label="$t('transaction.form.installmentCount.label')"
      path="installment_count"
    >
      <NInputNumber
        v-model:value="form.installment_count"
        :placeholder="$t('transaction.form.installmentCount.placeholder')"
        :min="2"
        :max="60"
        style="width: 100%"
      />
      <PreviewInstallments :preview="installmentPreview" />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.recurring.label')" path="is_recurring">
      <NSwitch v-model:value="form.is_recurring" :disabled="recurringDisabled" />
    </NFormItem>

    <NFormItem
      v-if="showRecurrenceCadence"
      :label="$t('transaction.form.recurrenceFrequency.label')"
      path="recurrence_unit"
    >
      <NSelect v-model:value="form.recurrence_unit" :options="recurrenceUnitOptions" />
    </NFormItem>

    <NFormItem
      v-if="showRecurrenceCadence"
      :label="$t('transaction.form.recurrenceInterval.label')"
      path="recurrence_interval"
    >
      <NInputNumber
        v-model:value="form.recurrence_interval"
        :placeholder="$t('transaction.form.recurrenceInterval.placeholder')"
        :min="1"
        :max="365"
        style="width: 100%"
      />
    </NFormItem>

    <NFormItem v-if="showEndDate" :label="$t('transaction.form.endDate.label')" path="end_date">
      <NDatePicker v-model:value="form.end_date" type="date" format="dd/MM/yyyy" style="width: 100%" clearable />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.autoSettle.label')" path="auto_settle">
      <NSwitch v-model:value="form.auto_settle" />
      <div class="quick-transaction-form__hint">{{ $t('transaction.form.autoSettle.hint') }}</div>
    </NFormItem>

    <NFormItem :label="$t('transaction.form.description.label')" path="description">
      <NInput
        v-model:value="form.description"
        type="textarea"
        :placeholder="$t('transaction.form.description.placeholder')"
        :rows="2"
      />
    </NFormItem>
  </div>
</template>

<style scoped>
.quick-transaction-form__settings-link {
  display: inline-block;
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-brand-500);
  text-decoration: none;
}

.quick-transaction-form__settings-link:hover {
  text-decoration: underline;
}

.quick-transaction-form__hint {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.quick-transaction-form__budget-preview {
  margin-top: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.quick-transaction-form__budget-preview strong {
  color: var(--color-text-primary);
}

.quick-transaction-form__budget-preview--danger {
  border-color: var(--color-negative-border, var(--color-negative));
  background: var(--color-negative-bg);
  color: var(--color-negative);
}
</style>
