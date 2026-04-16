<script setup lang="ts">
import { computed, inject } from "vue";
import { NButton, NDatePicker, NForm, NFormItem, NInput, NModal, NSpace } from "naive-ui";

import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import {
  INSTALLMENT_VS_CASH_EXPENSE_FORM_KEY,
  INSTALLMENT_VS_CASH_GOAL_FORM_KEY,
  type InstallmentVsCashGoalForm,
  type InstallmentVsCashPlannedExpenseForm,
} from "./installment-vs-cash-bridge-modals.types";

defineOptions({ name: "InstallmentVsCashBridgeModals" });

const props = defineProps<{
  showGoalModal: boolean;
  showExpenseModal: boolean;
  feesEnabled: boolean;
  isCreatingGoal: boolean;
  isCreatingExpense: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  "update:showGoalModal": [value: boolean];
  "update:showExpenseModal": [value: boolean];
  submitGoal: [];
  submitExpense: [];
}>();

const goalForm = inject<InstallmentVsCashGoalForm>(INSTALLMENT_VS_CASH_GOAL_FORM_KEY)!;
const expenseForm = inject<InstallmentVsCashPlannedExpenseForm>(INSTALLMENT_VS_CASH_EXPENSE_FORM_KEY)!;

const goalShow = computed({
  get: () => props.showGoalModal,
  set: (v: boolean) => emit("update:showGoalModal", v),
});
const expenseShow = computed({
  get: () => props.showExpenseModal,
  set: (v: boolean) => emit("update:showExpenseModal", v),
});
</script>

<template>
  <div class="installment-vs-cash-bridge-modals">
    <NModal v-model:show="goalShow" preset="card" :title="t('pages.installmentVsCash.goalModal.title')" class="installment-vs-cash-bridge-modals__modal">
      <NForm label-placement="top">
        <NFormItem :label="t('pages.installmentVsCash.goalModal.titleLabel')">
          <NInput v-model:value="goalForm.title" />
        </NFormItem>

        <NFormItem :label="t('pages.installmentVsCash.goalModal.descriptionLabel')">
          <NInput v-model:value="goalForm.description" type="textarea" />
        </NFormItem>

        <NFormItem :label="t('pages.installmentVsCash.goalModal.targetDateLabel')">
          <NDatePicker v-model:value="goalForm.targetDate" type="date" clearable />
        </NFormItem>

        <NSpace justify="end">
          <NButton @click="goalShow = false">{{ t('pages.installmentVsCash.goalModal.cancel') }}</NButton>
          <NButton type="primary" :loading="isCreatingGoal" @click="emit('submitGoal')">
            {{ t('pages.installmentVsCash.goalModal.submit') }}
          </NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal v-model:show="expenseShow" preset="card" :title="t('pages.installmentVsCash.expenseModal.title')" class="installment-vs-cash-bridge-modals__modal">
      <NForm label-placement="top">
        <NFormItem :label="t('pages.installmentVsCash.expenseModal.titleLabel')">
          <NInput v-model:value="expenseForm.title" />
        </NFormItem>

        <NFormItem :label="t('pages.installmentVsCash.expenseModal.descriptionLabel')">
          <NInput v-model:value="expenseForm.description" type="textarea" />
        </NFormItem>

        <NFormItem :label="t('pages.installmentVsCash.expenseModal.modeLabel')">
          <UiSegmentedControl
            v-model="expenseForm.selectedOption"
            :options="[
              { label: t('pages.installmentVsCash.expenseModal.cashLabel'), value: 'cash' },
              { label: t('pages.installmentVsCash.expenseModal.installmentLabel'), value: 'installment' },
            ]"
            :aria-label="t('pages.installmentVsCash.expenseModal.modeAriaLabel')"
          />
        </NFormItem>

        <NFormItem
          v-if="expenseForm.selectedOption === 'cash'"
          :label="t('pages.installmentVsCash.expenseModal.dueDateLabel')"
        >
          <NDatePicker v-model:value="expenseForm.dueDate" type="date" clearable />
        </NFormItem>
        <NFormItem v-else :label="t('pages.installmentVsCash.expenseModal.firstDueDateLabel')">
          <NDatePicker v-model:value="expenseForm.firstDueDate" type="date" clearable />
        </NFormItem>

        <NFormItem v-if="feesEnabled" :label="t('pages.installmentVsCash.expenseModal.upfrontDateLabel')">
          <NDatePicker v-model:value="expenseForm.upfrontDueDate" type="date" clearable />
        </NFormItem>

        <NSpace justify="end">
          <NButton @click="expenseShow = false">{{ t('pages.installmentVsCash.expenseModal.cancel') }}</NButton>
          <NButton type="primary" :loading="isCreatingExpense" @click="emit('submitExpense')">
            {{ t('pages.installmentVsCash.expenseModal.submit') }}
          </NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped>
:deep(.installment-vs-cash-bridge-modals__modal) {
  width: min(720px, calc(100vw - 32px));
}
</style>
