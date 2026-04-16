<script setup lang="ts">
import { computed, inject } from "vue";
import { NButton, NDatePicker, NFormItem, NInput, NModal, NSpace } from "naive-ui";

import type { ThirteenthSalaryResult } from "~/features/tools/model/thirteenth-salary";
import {
  THIRTEENTH_SALARY_GOAL_FORM_KEY,
  type ThirteenthSalaryGoalForm,
} from "./thirteenth-salary-bridge-modals.types";

defineOptions({ name: "ThirteenthSalaryBridgeModals" });

const props = defineProps<{
  showGoalModal: boolean;
  showBudgetModal: boolean;
  result: ThirteenthSalaryResult | null;
  isBridging: boolean;
  isCreatingGoal: boolean;
  isCreatingReceivable: boolean;
  isSavingSimulation: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
  formatBrl: (value: number) => string;
}>();

const emit = defineEmits<{
  "update:showGoalModal": [value: boolean];
  "update:showBudgetModal": [value: boolean];
  createGoal: [];
  addToBudget: [];
}>();

const goalForm = inject<ThirteenthSalaryGoalForm>(THIRTEENTH_SALARY_GOAL_FORM_KEY)!;
const goalShow = computed({ get: () => props.showGoalModal, set: (v: boolean) => emit("update:showGoalModal", v) });
const budgetShow = computed({ get: () => props.showBudgetModal, set: (v: boolean) => emit("update:showBudgetModal", v) });
</script>

<template>
  <div class="thirteenth-salary-bridge-modals">
    <NModal
      v-model:show="goalShow"
      preset="card"
      :title="t('thirteenthSalary.goalModal.title')"
      style="max-width: 480px"
      :mask-closable="!isBridging"
      :closable="!isBridging"
    >
      <NSpace vertical :size="16">
        <NFormItem :label="t('thirteenthSalary.goalModal.nameLabel')">
          <NInput
            v-model:value="goalForm.name"
            :placeholder="t('thirteenthSalary.goalModal.namePlaceholder')"
          />
        </NFormItem>

        <NFormItem :label="t('thirteenthSalary.goalModal.targetDateLabel')">
          <NDatePicker
            v-model:value="goalForm.targetDate"
            type="date"
            style="width: 100%"
          />
        </NFormItem>

        <div v-if="result" class="thirteenth-salary-bridge-modals__summary">
          <span>{{ t('thirteenthSalary.goalModal.targetAmountLabel') }}</span>
          <span class="thirteenth-salary-bridge-modals__value--positive">
            {{ formatBrl(result.totalNet) }}
          </span>
        </div>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="isBridging" @click="goalShow = false">
            {{ t('thirteenthSalary.goalModal.cancel') }}
          </NButton>
          <NButton
            type="primary"
            :loading="isCreatingGoal || isSavingSimulation"
            :disabled="!goalForm.name"
            @click="emit('createGoal')"
          >
            {{ t('thirteenthSalary.goalModal.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="budgetShow"
      preset="card"
      :title="t('thirteenthSalary.budgetModal.title')"
      style="max-width: 480px"
      :mask-closable="!isBridging"
      :closable="!isBridging"
    >
      <NSpace v-if="result" vertical :size="12">
        <p class="thirteenth-salary-bridge-modals__description">
          {{ t('thirteenthSalary.budgetModal.description') }}
        </p>

        <div class="thirteenth-salary-bridge-modals__rows">
          <div class="thirteenth-salary-bridge-modals__row">
            <span>{{ t('thirteenthSalary.budget.firstInstallmentLabel') }}</span>
            <span class="thirteenth-salary-bridge-modals__value--positive">
              {{ formatBrl(result.firstInstallment.net) }}
            </span>
          </div>
          <div class="thirteenth-salary-bridge-modals__row thirteenth-salary-bridge-modals__row--deduction">
            <span>{{ t('thirteenthSalary.results.firstInstallmentDate') }}</span>
          </div>
          <div class="thirteenth-salary-bridge-modals__row" style="margin-top:8px">
            <span>{{ t('thirteenthSalary.budget.secondInstallmentLabel') }}</span>
            <span class="thirteenth-salary-bridge-modals__value--positive">
              {{ formatBrl(result.secondInstallment.net) }}
            </span>
          </div>
          <div class="thirteenth-salary-bridge-modals__row thirteenth-salary-bridge-modals__row--deduction">
            <span>{{ t('thirteenthSalary.results.secondInstallmentDate') }}</span>
          </div>
        </div>
      </NSpace>

      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="isBridging" @click="budgetShow = false">
            {{ t('thirteenthSalary.budgetModal.cancel') }}
          </NButton>
          <NButton
            type="primary"
            :loading="isCreatingReceivable || isSavingSimulation"
            @click="emit('addToBudget')"
          >
            {{ t('thirteenthSalary.budgetModal.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.thirteenth-salary-bridge-modals__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
}

.thirteenth-salary-bridge-modals__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.thirteenth-salary-bridge-modals__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.thirteenth-salary-bridge-modals__row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.thirteenth-salary-bridge-modals__row--deduction {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.thirteenth-salary-bridge-modals__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}
</style>
