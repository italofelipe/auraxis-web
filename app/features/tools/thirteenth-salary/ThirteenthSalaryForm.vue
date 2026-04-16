<script setup lang="ts">
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NTooltip,
  type SelectOption,
} from "naive-ui";
import { Info } from "lucide-vue-next";

import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import type { ThirteenthSalaryFormState } from "~/features/tools/model/thirteenth-salary";

defineOptions({ name: "ThirteenthSalaryForm" });

defineProps<{
  form: ThirteenthSalaryFormState;
  validationError: string | null;
  isDirty: boolean;
  monthsOptions: SelectOption[];
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  patch: [value: Partial<ThirteenthSalaryFormState>];
  reset: [];
  submit: [];
}>();
</script>

<template>
  <UiGlassPanel class="thirteenth-salary-form">
    <NForm @submit.prevent="emit('submit')">
      <CalculatorFormSection :title="t('thirteenthSalary.form.title')">
        <NFormItem :label="t('thirteenthSalary.form.grossSalary')">
          <NInputNumber
            :value="form.grossSalary"
            :placeholder="t('thirteenthSalary.form.grossSalaryPlaceholder')"
            :min="0"
            :precision="2"
            prefix="R$"
            style="width: 100%"
            @update:value="(v) => emit('patch', { grossSalary: v })"
          />
        </NFormItem>

        <NFormItem :label="t('thirteenthSalary.form.monthsWorked')">
          <NSelect
            :value="form.monthsWorked"
            :options="monthsOptions"
            style="width: 100%"
            @update:value="(v) => emit('patch', { monthsWorked: v })"
          />
        </NFormItem>

        <NFormItem>
          <template #label>
            {{ t('thirteenthSalary.form.variablePay') }}
            <NTooltip>
              <template #trigger>
                <Info :size="14" class="thirteenth-salary-form__tooltip-icon" />
              </template>
              {{ t('thirteenthSalary.form.variablePayTooltip') }}
            </NTooltip>
          </template>
          <NInputNumber
            :value="form.variablePay"
            :min="0"
            :precision="2"
            prefix="R$"
            style="width: 100%"
            @update:value="(v) => emit('patch', { variablePay: v ?? 0 })"
          />
        </NFormItem>

        <NFormItem>
          <template #label>
            {{ t('thirteenthSalary.form.advancePaid') }}
            <NTooltip>
              <template #trigger>
                <Info :size="14" class="thirteenth-salary-form__tooltip-icon" />
              </template>
              {{ t('thirteenthSalary.form.advancePayTooltip') }}
            </NTooltip>
          </template>
          <NInputNumber
            :value="form.advancePaid"
            :min="0"
            :precision="2"
            prefix="R$"
            style="width: 100%"
            @update:value="(v) => emit('patch', { advancePaid: v ?? 0 })"
          />
        </NFormItem>

        <NFormItem>
          <template #label>
            {{ t('thirteenthSalary.form.dependents') }}
            <NTooltip>
              <template #trigger>
                <Info :size="14" class="thirteenth-salary-form__tooltip-icon" />
              </template>
              {{ t('thirteenthSalary.form.dependentsTooltip') }}
            </NTooltip>
          </template>
          <NInputNumber
            :value="form.dependents"
            :min="0"
            :max="10"
            :precision="0"
            style="width: 100%"
            @update:value="(v) => emit('patch', { dependents: v ?? 0 })"
          />
        </NFormItem>
      </CalculatorFormSection>

      <NAlert v-if="validationError" type="warning" style="margin-top:12px">
        {{ validationError }}
      </NAlert>

      <div class="thirteenth-salary-form__actions">
        <NButton v-if="isDirty" quaternary @click="emit('reset')">
          {{ t('thirteenthSalary.form.reset') }}
        </NButton>
        <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
          {{ t('thirteenthSalary.form.calculate') }}
        </NButton>
      </div>
    </NForm>
  </UiGlassPanel>
</template>

<style scoped>
.thirteenth-salary-form {
  padding: var(--space-4);
}

.thirteenth-salary-form__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.thirteenth-salary-form__tooltip-icon {
  margin-left: 4px;
  cursor: help;
  vertical-align: middle;
}
</style>
