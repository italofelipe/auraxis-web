<script setup lang="ts">
import { inject } from "vue";
import {
  NDatePicker,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  type SelectOption,
} from "naive-ui";

import {
  QUICK_TRANSACTION_FORM_KEY,
  type QuickTransactionFormState,
} from "./useQuickTransactionForm";

defineOptions({ name: "QuickTransactionFormFields" });

defineProps<{
  tagOptions: SelectOption[];
  accountOptions: SelectOption[];
  creditCardOptions: SelectOption[];
  statusOptions: SelectOption[];
  showCreditCard: boolean;
  showInstallment: boolean;
  showInstallmentCount: boolean;
  showEndDate: boolean;
  recurringDisabled: boolean;
}>();

const form = inject<QuickTransactionFormState>(QUICK_TRANSACTION_FORM_KEY)!;
</script>

<template>
  <div class="quick-transaction-form-fields">
    <NFormItem :label="$t('transaction.form.title.label')" path="title">
      <NInput v-model:value="form.title" :placeholder="$t('transaction.form.title.placeholder')" />
    </NFormItem>

    <NFormItem :label="$t('transaction.form.amount.label')" path="amount">
      <NInputNumber
        v-model:value="form.amount"
        :placeholder="$t('transaction.form.amount.placeholder')"
        :min="0.01"
        :precision="2"
        style="width: 100%"
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
        clearable
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
    </NFormItem>

    <NFormItem :label="$t('transaction.form.recurring.label')" path="is_recurring">
      <NSwitch v-model:value="form.is_recurring" :disabled="recurringDisabled" />
    </NFormItem>

    <NFormItem v-if="showEndDate" :label="$t('transaction.form.endDate.label')" path="end_date">
      <NDatePicker v-model:value="form.end_date" type="date" format="dd/MM/yyyy" style="width: 100%" clearable />
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
</style>
