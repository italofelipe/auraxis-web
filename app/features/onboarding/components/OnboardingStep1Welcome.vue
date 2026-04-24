<script setup lang="ts">
import { computed, ref } from "vue";
import { UserRound } from "lucide-vue-next";
import { useOnboarding, type OnboardingStep1Data } from "../composables/useOnboarding";
import { useUpdateProfileMutation } from "~/features/profile/composables/use-update-profile-mutation";
import { useUserStore } from "~/stores/user";

const emit = defineEmits<{ (e: "next"): void }>();

const { t } = useI18n();
const { getStepData, setStepData } = useOnboarding();
const userStore = useUserStore();
const mutation = useUpdateProfileMutation();

const persisted = getStepData("step1");
const monthlyIncome = ref<string>(persisted?.monthlyIncome ?? "");
const investorProfile = ref<OnboardingStep1Data["investorProfile"]>(
  persisted?.investorProfile ?? "conservador",
);
const submitError = ref<string>("");

const displayName = computed((): string => userStore.profile?.name?.split(" ")[0] ?? "");
const canSubmit = computed((): boolean => {
  const income = Number(monthlyIncome.value.replace(",", "."));
  return Number.isFinite(income) && income > 0 && !mutation.isPending.value;
});

/**
 * Persists the collected basics to the user profile and advances the wizard.
 * The backend accepts partial PUTs (see app/schemas/user_schemas.py), so we
 * only send the fields the onboarding captured.
 */
async function onSubmit(): Promise<void> {
  if (!canSubmit.value) { return; }
  submitError.value = "";
  const incomeStr = monthlyIncome.value.replace(",", ".");
  const payload: OnboardingStep1Data = {
    monthlyIncome: incomeStr,
    investorProfile: investorProfile.value,
  };
  setStepData("step1", payload);

  try {
    await mutation.mutateAsync({
      monthly_income: incomeStr,
      investor_profile: investorProfile.value,
    });
    emit("next");
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : t("onboarding.step1.errorGeneric");
  }
}
</script>

<template>
  <form class="onboarding-step" data-testid="onboarding-step1-form" @submit.prevent="onSubmit">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <UserRound :size="36" />
    </div>
    <h2 class="onboarding-step__title">
      {{ displayName ? t("onboarding.step1.titleWithName", { name: displayName }) : t("onboarding.step1.title") }}
    </h2>
    <p class="onboarding-step__description">{{ t("onboarding.step1.description") }}</p>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step1.monthlyIncomeLabel") }}</span>
      <input
        v-model="monthlyIncome"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        required
        :placeholder="t('onboarding.step1.monthlyIncomePlaceholder')"
        data-testid="onboarding-step1-income"
      >
    </label>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step1.investorProfileLabel") }}</span>
      <select v-model="investorProfile" data-testid="onboarding-step1-profile">
        <option value="conservador">{{ t("onboarding.step1.profileConservador") }}</option>
        <option value="explorador">{{ t("onboarding.step1.profileExplorador") }}</option>
        <option value="entusiasta">{{ t("onboarding.step1.profileEntusiasta") }}</option>
      </select>
    </label>

    <p v-if="submitError" class="onboarding-step__error" role="alert" data-testid="onboarding-step1-error">
      {{ submitError }}
    </p>

    <button
      type="submit"
      class="onboarding-step__cta"
      :disabled="!canSubmit"
      data-testid="step1-next"
    >
      {{ mutation.isPending.value ? t("onboarding.step1.ctaLoading") : t("onboarding.step1.cta") }}
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
.onboarding-step__field input,
.onboarding-step__field select {
  padding: 10px var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
.onboarding-step__field input:focus,
.onboarding-step__field select:focus {
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
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease;
}
.onboarding-step__cta:hover:enabled { background: var(--color-brand-500); }
.onboarding-step__cta:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
