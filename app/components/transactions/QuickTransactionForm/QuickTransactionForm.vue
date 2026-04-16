<script setup lang="ts">
import { computed, toRef } from "vue";
import { NAlert, NButton, NForm, NModal, NSpace } from "naive-ui";

import QuickTransactionFormFields from "./QuickTransactionFormFields.vue";
import type { QuickTransactionFormProps } from "./QuickTransactionForm.types";
import { useQuickTransactionForm } from "./useQuickTransactionForm";

const { t } = useI18n();

const props = defineProps<QuickTransactionFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const typeRef = toRef(props, "type");

const {
  formRef,
  form,
  mutation,
  tagOptions,
  accountOptions,
  creditCardOptions,
  statusOptions,
  showCreditCard,
  showInstallment,
  showInstallmentCount,
  showEndDate,
  recurringDisabled,
  rules,
  submit,
  resetForm,
} = useQuickTransactionForm({
  type: typeRef,
  t,
  onSuccess: () => {
    emit("success");
    emit("update:visible", false);
  },
});

const modalTitle = computed((): string =>
  props.type === "income"
    ? t("transaction.form.title.income")
    : t("transaction.form.title.expense"),
);

const submitButtonType = computed(() =>
  props.type === "income" ? "success" : "error",
);

/**
 * Closes the modal without submitting and resets the form.
 */
function handleClose(): void {
  emit("update:visible", false);
  resetForm();
}
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="modalTitle"
    class="quick-transaction-form-modal"
    :style="{ maxWidth: '520px', width: '100%' }"
    @update:show="handleClose"
  >
    <!-- v8 ignore next 7 -->
    <NAlert
      v-if="mutation.isError.value"
      type="error"
      :title="$t('transaction.form.errorTitle')"
      style="margin-bottom: 16px;"
    >
      {{ mutation.error.value?.message ?? $t('transaction.form.errorFallback') }}
    </NAlert>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <QuickTransactionFormFields
        :form="form"
        :tag-options="tagOptions"
        :account-options="accountOptions"
        :credit-card-options="creditCardOptions"
        :status-options="statusOptions"
        :show-credit-card="showCreditCard"
        :show-installment="showInstallment"
        :show-installment-count="showInstallmentCount"
        :show-end-date="showEndDate"
        :recurring-disabled="recurringDisabled"
      />
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="mutation.isPending.value" @click="handleClose">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton :type="submitButtonType" :loading="mutation.isPending.value" @click="submit">
          {{ $t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.quick-transaction-form-modal {
  color: var(--color-text-primary);
}
</style>
