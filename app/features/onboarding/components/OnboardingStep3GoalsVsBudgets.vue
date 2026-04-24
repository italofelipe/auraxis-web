<script setup lang="ts">
import { computed, ref } from "vue";
import { Target } from "lucide-vue-next";
import { useOnboarding, type OnboardingStep3Data } from "../composables/useOnboarding";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";

const emit = defineEmits<{ (e: "complete"): void }>();

const { t } = useI18n();
const { getStepData, setStepData } = useOnboarding();
const mutation = useCreateGoalMutation();

const persisted = getStepData("step3");
// Default target date = 1 year from today so the input starts with something sensible.
const oneYearFromNow = ((): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();

const name = ref<string>(persisted?.name ?? "");
const targetAmount = ref<string>(persisted?.targetAmount ?? "");
const targetDate = ref<string>(persisted?.targetDate ?? oneYearFromNow);
const submitError = ref<string>("");

const canSubmit = computed((): boolean => {
  const amt = Number(targetAmount.value.replace(",", "."));
  return (
    name.value.trim().length >= 2 &&
    Number.isFinite(amt) && amt > 0 &&
    targetDate.value.length === 10 &&
    !mutation.isPending.value
  );
});

/** Creates the first goal via POST /goals and completes the wizard. */
async function onSubmit(): Promise<void> {
  if (!canSubmit.value) { return; }
  submitError.value = "";
  const normalized: OnboardingStep3Data = {
    name: name.value.trim(),
    targetAmount: targetAmount.value.replace(",", "."),
    targetDate: targetDate.value,
  };
  setStepData("step3", normalized);

  try {
    await mutation.mutateAsync({
      name: normalized.name,
      target_amount: Number(normalized.targetAmount),
      target_date: normalized.targetDate,
    });
    emit("complete");
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : t("onboarding.step3.errorGeneric");
  }
}
</script>

<template>
  <form class="onboarding-step" data-testid="onboarding-step3-form" @submit.prevent="onSubmit">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <Target :size="36" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step3.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step3.description") }}</p>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step3.nameLabel") }}</span>
      <input
        v-model="name"
        type="text"
        autocomplete="off"
        required
        minlength="2"
        :placeholder="t('onboarding.step3.namePlaceholder')"
        data-testid="onboarding-step3-name"
      >
    </label>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step3.targetAmountLabel") }}</span>
      <input
        v-model="targetAmount"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        required
        :placeholder="t('onboarding.step3.targetAmountPlaceholder')"
        data-testid="onboarding-step3-amount"
      >
    </label>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step3.targetDateLabel") }}</span>
      <input v-model="targetDate" type="date" required data-testid="onboarding-step3-date">
    </label>

    <p v-if="submitError" class="onboarding-step__error" role="alert" data-testid="onboarding-step3-error">
      {{ submitError }}
    </p>

    <button
      type="submit"
      class="onboarding-step__cta"
      :disabled="!canSubmit"
      data-testid="step3-complete"
    >
      {{ mutation.isPending.value ? t("onboarding.step3.ctaLoading") : t("onboarding.step3.cta") }}
    </button>
  </form>
</template>

<style scoped>
.onboarding-step {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: left;
  padding: var(--space-2) 0;
  width: 100%;
}
.onboarding-step__icon-wrap {
  align-self: center;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-glow-xs);
  border-radius: var(--radius-full);
  color: var(--color-brand-600);
}
.onboarding-step__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  text-align: center;
}
.onboarding-step__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  text-align: center;
}
.onboarding-step__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.onboarding-step__field input {
  padding: 10px var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
.onboarding-step__field input:focus {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 1px;
}
.onboarding-step__error {
  margin: 0;
  color: var(--color-negative, #c0392b);
  font-size: var(--font-size-xs);
}
.onboarding-step__cta {
  align-self: center;
  margin-top: var(--space-1);
  padding: 10px var(--space-4);
  background: var(--color-positive);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.onboarding-step__cta:hover:enabled { filter: brightness(1.08); }
.onboarding-step__cta:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
