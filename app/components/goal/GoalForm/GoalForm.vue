<script setup lang="ts">
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NButton,
  NSpace,
  type FormInst,
  type FormRules,
} from "naive-ui";
import type { GoalFormProps } from "./GoalForm.types";
import type { CreateGoalPayload, GoalStatus } from "~/features/goals/contracts/goal.dto";

const props = defineProps<GoalFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateGoalPayload];
}>();

type DatePreset = "1m" | "3m" | "6m" | "1y" | "custom";

const formRef = ref<FormInst | null>(null);

const formModel = reactive({
  name: "",
  description: null as string | null,
  target_amount: null as number | null,
  current_amount: null as number | null,
  target_date: null as string | null,
  status: null as GoalStatus | null,
});

const datePreset = ref<DatePreset | null>(null);
const showDatePicker = computed(() => datePreset.value === "custom");

const isEditMode = computed(() => props.goal !== null && props.goal !== undefined);

/**
 * Sets the target_date to today + given number of months as YYYY-MM-DD.
 *
 * @param preset - The date preset shorthand to apply.
 */
const applyDatePreset = (preset: DatePreset): void => {
  datePreset.value = preset;
  if (preset === "custom") {
    formModel.target_date = null;
    return;
  }
  const today = new Date();
  const monthsMap: Record<Exclude<DatePreset, "custom">, number> = {
    "1m": 1,
    "3m": 3,
    "6m": 6,
    "1y": 12,
  };
  const months = monthsMap[preset as Exclude<DatePreset, "custom">];
  today.setMonth(today.getMonth() + months);
  formModel.target_date = today.toISOString().split("T")[0] ?? null;
};

/**
 * Converts a timestamp (ms) from NDatePicker to a YYYY-MM-DD string.
 *
 * @param ts - Timestamp in milliseconds, or null when the picker is cleared.
 */
const onDatePickerUpdate = (ts: number | null): void => {
  if (ts === null) {
    formModel.target_date = null;
    return;
  }
  formModel.target_date = new Date(ts).toISOString().split("T")[0] ?? null;
};

/** Converts a YYYY-MM-DD string to a timestamp for NDatePicker. */
const datePickerValue = computed<number | null>(() => {
  if (!formModel.target_date) {
    return null;
  }
  return new Date(`${formModel.target_date}T00:00:00`).getTime();
});

const STATUS_OPTIONS: Array<{ label: string; value: GoalStatus }> = [
  { label: "Ativa", value: "active" },
  { label: "Concluída", value: "completed" },
  { label: "Pausada", value: "paused" },
  { label: "Cancelada", value: "cancelled" },
];

const DATE_PRESETS: Array<{ label: string; value: DatePreset }> = [
  { label: "1 mês", value: "1m" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "1 ano", value: "1y" },
  { label: "Personalizado", value: "custom" },
];

const rules: FormRules = {
  name: [
    { required: true, message: "Nome é obrigatório", trigger: ["blur", "input"] },
    { min: 2, message: "Mínimo 2 caracteres", trigger: ["blur", "input"] },
  ],
  target_amount: [
    {
      required: true,
      type: "number",
      message: "Valor da meta é obrigatório",
      trigger: ["blur", "change"],
    },
    {
      validator: (_rule: unknown, value: unknown): boolean =>
        typeof value === "number" && value > 0,
      message: "Valor deve ser positivo",
      trigger: ["blur", "change"],
    },
  ],
};

/** Resets the form to its initial state. */
const resetForm = (): void => {
  formModel.name = "";
  formModel.description = null;
  formModel.target_amount = null;
  formModel.current_amount = null;
  formModel.target_date = null;
  formModel.status = null;
  datePreset.value = null;
  formRef.value?.restoreValidation();
};

/** Populates the form from an existing goal for edit mode. */
const populateFromGoal = (): void => {
  if (!props.goal) {
    return;
  }
  formModel.name = props.goal.name;
  formModel.description = props.goal.description;
  formModel.target_amount = props.goal.target_amount;
  formModel.current_amount = props.goal.current_amount;
  formModel.target_date = props.goal.target_date;
  formModel.status = props.goal.status;
  datePreset.value = "custom";
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.goal) {
        populateFromGoal();
      } else {
        resetForm();
      }
    }
  },
);

/** Validates then emits the submit event with the form payload. */
const onSubmit = (): void => {
  formRef.value?.validate((errors) => {
    if (errors) {
      return;
    }
    const payload: CreateGoalPayload = {
      name: formModel.name,
      description: formModel.description ?? null,
      target_amount: formModel.target_amount!,
      ...(formModel.current_amount !== null && formModel.current_amount !== undefined
        ? { current_amount: formModel.current_amount }
        : {}),
      ...(formModel.target_date ? { target_date: formModel.target_date } : {}),
      ...(formModel.status ? { status: formModel.status } : {}),
    };
    emit("submit", payload);
  });
};

/**
 * Closes the modal by emitting the update:visible event with false.
 */
const onClose = (): void => {
  emit("update:visible", false);
};
</script>

<template>
  <NModal
    :show="props.visible"
    :title="isEditMode ? 'Editar Meta' : 'Nova Meta'"
    preset="card"
    class="goal-form-modal"
    :mask-closable="true"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="Nome" path="name">
        <NInput
          v-model:value="formModel.name"
          placeholder="Ex: Reserva de emergência"
          maxlength="120"
        />
      </NFormItem>

      <NFormItem label="Descrição" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="Descrição opcional da meta"
          :rows="2"
          maxlength="500"
        />
      </NFormItem>

      <NFormItem label="Valor da meta (R$)" path="target_amount">
        <NInputNumber
          v-model:value="formModel.target_amount"
          placeholder="0,00"
          :min="0.01"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem label="Valor acumulado (R$)" path="current_amount">
        <NInputNumber
          v-model:value="formModel.current_amount"
          placeholder="0,00"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem label="Prazo" path="target_date">
        <div class="goal-form__date-section">
          <NSpace wrap>
            <NButton
              v-for="preset in DATE_PRESETS"
              :key="preset.value"
              size="small"
              :type="datePreset === preset.value ? 'primary' : 'default'"
              @click="applyDatePreset(preset.value)"
            >
              {{ preset.label }}
            </NButton>
          </NSpace>
          <NDatePicker
            v-if="showDatePicker"
            :value="datePickerValue"
            type="date"
            format="dd/MM/yyyy"
            placeholder="Selecione a data"
            class="goal-form__date-picker"
            @update:value="onDatePickerUpdate"
          />
        </div>
      </NFormItem>

      <NFormItem v-if="isEditMode" label="Status" path="status">
        <NSelect
          v-model:value="formModel.status"
          :options="STATUS_OPTIONS"
          placeholder="Selecione o status"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="onClose">Cancelar</NButton>
        <NButton type="primary" @click="onSubmit">
          {{ isEditMode ? "Salvar alterações" : "Criar meta" }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.goal-form-modal {
  width: min(540px, 95vw);
}

.goal-form__date-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.goal-form__date-picker {
  width: 100%;
}
</style>
