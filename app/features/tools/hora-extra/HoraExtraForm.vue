<script setup lang="ts">
import { NAlert, NButton, NForm, NFormItem, NInputNumber, NTooltip } from "naive-ui";
import { Info } from "lucide-vue-next";

import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import {
  CLT_DEFAULT_HOURS_PER_MONTH,
  type HoraExtraFormState,
} from "~/features/tools/model/hora-extra";

defineOptions({ name: "HoraExtraForm" });

defineProps<{
  form: HoraExtraFormState;
  validationError: string | null;
  isDirty: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  patch: [partial: Partial<HoraExtraFormState>];
  reset: [];
  submit: [];
}>();

const overtimeFields = [
  { key: "hours50", labelKey: "horaExtra.form.hours50", tooltipKey: "horaExtra.form.hours50Tooltip" },
  { key: "hours75", labelKey: "horaExtra.form.hours75", tooltipKey: "horaExtra.form.hours75Tooltip" },
  { key: "hours100", labelKey: "horaExtra.form.hours100", tooltipKey: "horaExtra.form.hours100Tooltip" },
] as const;
</script>

<template>
  <UiGlassPanel class="hora-extra-form">
    <NForm @submit.prevent="emit('submit')">
      <CalculatorFormSection :title="t('horaExtra.form.title')">
        <NFormItem :label="t('horaExtra.form.grossSalary')">
          <NInputNumber
            :value="form.grossSalary"
            :placeholder="t('horaExtra.form.grossSalaryPlaceholder')"
            :min="0"
            :precision="2"
            prefix="R$"
            style="width: 100%"
            @update:value="(v) => emit('patch', { grossSalary: v })"
          />
        </NFormItem>

        <NFormItem>
          <template #label>
            {{ t('horaExtra.form.hoursPerMonth') }}
            <NTooltip>
              <template #trigger>
                <Info :size="14" class="hora-extra-form__info-icon" />
              </template>
              {{ t('horaExtra.form.hoursPerMonthTooltip') }}
            </NTooltip>
          </template>
          <NInputNumber
            :value="form.hoursPerMonth"
            :min="1"
            :max="744"
            :precision="0"
            style="width: 100%"
            @update:value="(v) => emit('patch', { hoursPerMonth: v ?? CLT_DEFAULT_HOURS_PER_MONTH })"
          />
        </NFormItem>

        <NFormItem v-for="field in overtimeFields" :key="field.key">
          <template #label>
            {{ t(field.labelKey) }}
            <NTooltip>
              <template #trigger>
                <Info :size="14" class="hora-extra-form__info-icon" />
              </template>
              {{ t(field.tooltipKey) }}
            </NTooltip>
          </template>
          <NInputNumber
            :value="form[field.key]"
            :min="0"
            :precision="1"
            style="width: 100%"
            @update:value="(v) => emit('patch', { [field.key]: v ?? 0 } as Partial<HoraExtraFormState>)"
          />
        </NFormItem>
      </CalculatorFormSection>

      <NAlert v-if="validationError" type="warning" class="hora-extra-form__alert">
        {{ validationError }}
      </NAlert>

      <div class="hora-extra-form__actions">
        <NButton v-if="isDirty" quaternary @click="emit('reset')">
          {{ t('horaExtra.form.reset') }}
        </NButton>
        <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
          {{ t('horaExtra.form.calculate') }}
        </NButton>
      </div>
    </NForm>
  </UiGlassPanel>
</template>

<style scoped>
.hora-extra-form {
  width: 100%;
}

.hora-extra-form__info-icon {
  margin-left: 4px;
  cursor: help;
  vertical-align: middle;
}

.hora-extra-form__alert {
  margin-top: 12px;
}

.hora-extra-form__actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}
</style>
