<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { NModal, NForm, NFormItem, NInput, NDatePicker, NButton, NSpace } from "naive-ui";

import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import UiMoneyInput from "~/components/ui/UiMoneyInput/UiMoneyInput.vue";
import { useToast } from "~/composables/useToast";
import { useRecordContributionMutation } from "~/features/goals/queries/use-record-contribution-mutation";
import {
  computeSignedAmount,
  type ContributionDirection,
} from "~/features/goals/model/contribution-amount";
import type { ApiError } from "~/core/errors";
import type {
  GoalContributionModalProps,
  GoalContributionModalEmits,
} from "./GoalContributionModal.types";

/** Maximum length accepted for the optional note. */
const NOTE_MAX_LENGTH = 200;

const { t } = useI18n();
const toast = useToast();

const props = defineProps<GoalContributionModalProps>();
const emit = defineEmits<GoalContributionModalEmits>();

const goalId = computed(() => props.goal.id);
const mutation = useRecordContributionMutation(goalId.value);

/**
 * Returns today's date (local) as a YYYY-MM-DD string.
 *
 * @returns Today's date in ISO YYYY-MM-DD form.
 */
const todayIso = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const formModel = reactive({
  magnitude: null as number | null,
  direction: "deposit" as ContributionDirection,
  occurred_at: todayIso(),
  note: "" as string,
});

const formError = ref<string | null>(null);

const DIRECTION_OPTIONS = computed(
  (): Array<{ value: ContributionDirection; label: string }> => [
    { value: "deposit", label: t("goal.contribution.direction.deposit") },
    { value: "withdrawal", label: t("goal.contribution.direction.withdrawal") },
  ],
);

const isSubmitting = computed(() => mutation.isPending.value);

const signedAmount = computed(() =>
  computeSignedAmount(formModel.magnitude, formModel.direction),
);

/** Converts the YYYY-MM-DD model value to a timestamp for NDatePicker. */
const datePickerValue = computed<number | null>(() => {
  if (!formModel.occurred_at) {
    return null;
  }
  return new Date(`${formModel.occurred_at}T00:00:00`).getTime();
});

/**
 * Disables any date strictly after today so future contributions are rejected
 * at the picker, matching the backend validation.
 *
 * @param ts Candidate timestamp from NDatePicker (ms).
 * @returns True when the date must be disabled.
 */
const isFutureDate = (ts: number): boolean => {
  const candidate = new Date(ts);
  candidate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return candidate.getTime() > today.getTime();
};

/**
 * Converts the NDatePicker timestamp back to a YYYY-MM-DD string, keeping today
 * when the field is cleared.
 *
 * @param ts Timestamp in milliseconds, or null when cleared.
 */
const onDateUpdate = (ts: number | null): void => {
  formModel.occurred_at = ts === null ? todayIso() : (new Date(ts).toISOString().slice(0, 10));
};

/** Resets the form to its default state. */
const resetForm = (): void => {
  formModel.magnitude = null;
  formModel.direction = props.initialDirection ?? "deposit";
  formModel.occurred_at = todayIso();
  formModel.note = "";
  formError.value = null;
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);

/** Closes the modal by emitting update:visible=false. */
const onClose = (): void => {
  emit("update:visible", false);
};

/**
 * Maps a mutation error to a friendly message, special-casing the backend
 * INSUFFICIENT_BALANCE code for withdrawals that would drive the balance below
 * zero.
 *
 * @param error Typed ApiError raised by the mutation.
 * @returns Localised, user-facing error message.
 */
const resolveErrorMessage = (error: ApiError): string => {
  if (error.code === "INSUFFICIENT_BALANCE") {
    return t("goal.contribution.toast.insufficientBalance");
  }
  return t("goal.contribution.toast.error");
};

/** Validates the form then records the contribution. */
const onConfirm = (): void => {
  const amount = signedAmount.value;
  if (amount === null) {
    formError.value = t("goal.contribution.amount.required");
    return;
  }
  formError.value = null;

  mutation.mutate(
    {
      amount,
      occurred_at: formModel.occurred_at,
      ...(formModel.note.trim() ? { note: formModel.note.trim() } : {}),
    },
    {
      onSuccess: (): void => {
        toast.success(t("goal.contribution.toast.success"));
        emit("recorded");
        emit("update:visible", false);
      },
      onError: (error: ApiError): void => {
        toast.error(resolveErrorMessage(error));
      },
    },
  );
};
</script>

<template>
  <NModal
    :show="props.visible"
    :title="$t('goal.contribution.title')"
    preset="card"
    class="goal-contribution-modal"
    style="width: min(480px, calc(100vw - 32px));"
    :mask-closable="!isSubmitting"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NForm :model="formModel" label-placement="top">
      <NFormItem :label="$t('goal.contribution.direction.label')">
        <UiSegmentedControl
          v-model="formModel.direction"
          :options="DIRECTION_OPTIONS"
          :aria-label="$t('goal.contribution.direction.label')"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.contribution.amount.label')">
        <UiMoneyInput
          v-model:value="formModel.magnitude"
          placeholder="0,00"
          :min="0.01"
        />
      </NFormItem>

      <p v-if="formError" class="goal-contribution-modal__error" role="alert">
        {{ formError }}
      </p>

      <NFormItem :label="$t('goal.contribution.date.label')">
        <NDatePicker
          :value="datePickerValue"
          type="date"
          format="dd/MM/yyyy"
          :is-date-disabled="isFutureDate"
          :placeholder="$t('goal.contribution.date.placeholder')"
          style="width: 100%"
          @update:value="onDateUpdate"
        />
      </NFormItem>

      <NFormItem :label="$t('goal.contribution.note.label')">
        <NInput
          v-model:value="formModel.note"
          type="textarea"
          :placeholder="$t('goal.contribution.note.placeholder')"
          :rows="2"
          :maxlength="NOTE_MAX_LENGTH"
          show-count
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="isSubmitting" @click="onClose">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton type="primary" :loading="isSubmitting" @click="onConfirm">
          {{ $t('goal.contribution.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.goal-contribution-modal__error {
  margin: calc(var(--space-2) * -1) 0 var(--space-2);
  color: var(--color-negative);
  font-size: var(--font-size-xs);
}
</style>
