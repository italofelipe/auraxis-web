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

const { t } = useI18n();

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

const STATUS_OPTIONS = computed((): Array<{ label: string; value: GoalStatus }> => [
  { label: t("goal.status.active"), value: "active" },
  { label: t("goal.status.completed"), value: "completed" },
  { label: t("goal.status.paused"), value: "paused" },
  { label: t("goal.status.cancelled"), value: "cancelled" },
]);

const DATE_PRESETS = computed((): Array<{ label: string; value: DatePreset }> => [
  { label: t("goal.form.datePresets.1m"), value: "1m" },
  { label: t("goal.form.datePresets.3m"), value: "3m" },
  { label: t("goal.form.datePresets.6m"), value: "6m" },
  { label: t("goal.form.datePresets.1y"), value: "1y" },
  { label: t("goal.form.datePresets.custom"), value: "custom" },
]);

const rules = computed((): FormRules => ({
  name: [
    { required: true, message: t("goal.form.name.required"), trigger: ["blur", "input"] },
    { min: 2, message: t("goal.form.name.minLength"), trigger: ["blur", "input"] },
  ],
  target_amount: [
    {
      required: true,
      type: "number",
      message: t("goal.form.targetAmount.required"),
      trigger: ["blur", "change"],
    },
    {
      validator: (_rule: unknown, value: unknown): boolean =>
        typeof value === "number" && value > 0,
      message: t("goal.form.targetAmount.positive"),
      trigger: ["blur", "change"],
    },
  ],
}));

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
    :title="isEditMode ? $t('goal.form.titleEdit') : $t('goal.form.titleCreate')"
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
      <NFormItem :label="$t('goal.form.name.label')" path="name">
        <NInput
          v-model:value="formModel.name"
          :placeholder="$t('goal.form.name.placeholder')"
          maxlength="120"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.form.description.label')" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          :placeholder="$t('goal.form.description.placeholder')"
          :rows="2"
          maxlength="500"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.form.targetAmount.label')" path="target_amount">
        <NInputNumber
          v-model:value="formModel.target_amount"
          placeholder="0,00"
          :min="0.01"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.form.currentAmount.label')" path="current_amount">
        <NInputNumber
          v-model:value="formModel.current_amount"
          placeholder="0,00"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.form.deadline.label')" path="target_date">
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
            :placeholder="$t('goal.form.deadline.placeholder')"
            class="goal-form__date-picker"
            @update:value="onDatePickerUpdate"
          />
        </div>
      </NFormItem>

      <NFormItem v-if="isEditMode" :label="$t('goal.form.status.label')" path="status">
        <NSelect
          v-model:value="formModel.status"
          :options="STATUS_OPTIONS"
          :placeholder="$t('goal.form.status.placeholder')"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="onClose">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="onSubmit">
          {{ isEditMode ? $t('goal.form.submitEdit') : $t('goal.form.submitCreate') }}
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
