<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowLeftRight, FileSpreadsheet } from "lucide-vue-next";
import { useOnboarding, type OnboardingStep2Data } from "../composables/useOnboarding";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import {
  BANK_IMPORT_FEATURE_FLAG_KEY,
  IMPORT_FEATURE_FLAG_KEY,
} from "~/features/import/model/import-config";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

const emit = defineEmits<{ (e: "next" | "import"): void }>();

const { t } = useI18n();
const { getStepData, setStepData } = useOnboarding();
const mutation = useCreateTransactionMutation();

// A porta só aparece se houver import atrás dela: com as duas flags desligadas
// o caminho levaria a uma página que só sabe dizer "indisponível".
const spreadsheetImportEnabled = useFeatureFlag(IMPORT_FEATURE_FLAG_KEY);
const bankImportEnabled = useFeatureFlag(BANK_IMPORT_FEATURE_FLAG_KEY);
const importEnabled = computed(
  (): boolean => spreadsheetImportEnabled.value || bankImportEnabled.value,
);

const today = new Date().toISOString().slice(0, 10);
const persisted = getStepData("step2");

const title = ref<string>(persisted?.title ?? "");
const amount = ref<string>(persisted?.amount ?? "");
const type = ref<OnboardingStep2Data["type"]>(persisted?.type ?? "income");
const dueDate = ref<string>(persisted?.dueDate ?? today);
const submitError = ref<string>("");

const canSubmit = computed((): boolean => {
  const amt = Number(amount.value.replace(",", "."));
  return (
    title.value.trim().length >= 2 &&
    Number.isFinite(amt) && amt > 0 &&
    dueDate.value.length === 10 &&
    !mutation.isPending.value
  );
});

/**
 * Advances without creating anything. Cadastrar transação deixou de ser
 * requisito para concluir o onboarding (#1261) — quem ainda não tem um
 * lançamento à mão não fica preso aqui.
 */
function onSkipStep(): void {
  if (mutation.isPending.value) { return; }
  submitError.value = "";
  emit("next");
}

/**
 * Caminho alternativo: em vez de digitar uma transação, o usuário traz o
 * histórico inteiro de uma planilha ou de um extrato. Quem manda o wizard
 * embora e navega é o pai — este passo só avisa qual porta foi escolhida.
 */
function onImportPath(): void {
  if (mutation.isPending.value) { return; }
  submitError.value = "";
  emit("import");
}

/** Creates the user's first real transaction and moves to the next step. */
async function onSubmit(): Promise<void> {
  if (!canSubmit.value) { return; }
  submitError.value = "";
  const normalized: OnboardingStep2Data = {
    title: title.value.trim(),
    amount: amount.value.replace(",", "."),
    type: type.value,
    dueDate: dueDate.value,
  };
  setStepData("step2", normalized);

  try {
    await mutation.mutateAsync({
      title: normalized.title,
      amount: normalized.amount,
      type: normalized.type,
      due_date: normalized.dueDate,
    });
    emit("next");
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : t("onboarding.step2.errorGeneric");
  }
}
</script>

<template>
  <form class="onboarding-step" data-testid="onboarding-step2-form" @submit.prevent="onSubmit">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <ArrowLeftRight :size="36" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step2.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step2.description") }}</p>

    <div class="onboarding-step__type-toggle" role="radiogroup" :aria-label="t('onboarding.step2.typeLabel')">
      <button
        type="button"
        :class="['onboarding-step__type-btn', { 'is-active': type === 'income' }]"
        role="radio"
        :aria-checked="type === 'income'"
        data-testid="onboarding-step2-type-income"
        @click="type = 'income'"
      >
        {{ t("onboarding.step2.typeIncome") }}
      </button>
      <button
        type="button"
        :class="['onboarding-step__type-btn', { 'is-active': type === 'expense' }]"
        role="radio"
        :aria-checked="type === 'expense'"
        data-testid="onboarding-step2-type-expense"
        @click="type = 'expense'"
      >
        {{ t("onboarding.step2.typeExpense") }}
      </button>
    </div>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step2.titleLabel") }}</span>
      <input
        v-model="title"
        type="text"
        autocomplete="off"
        required
        minlength="2"
        :placeholder="t('onboarding.step2.titlePlaceholder')"
        data-testid="onboarding-step2-title"
      >
    </label>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step2.amountLabel") }}</span>
      <input
        v-model="amount"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        required
        :placeholder="t('onboarding.step2.amountPlaceholder')"
        data-testid="onboarding-step2-amount"
      >
    </label>

    <label class="onboarding-step__field">
      <span>{{ t("onboarding.step2.dueDateLabel") }}</span>
      <input v-model="dueDate" type="date" required data-testid="onboarding-step2-duedate">
    </label>

    <p v-if="submitError" class="onboarding-step__error" role="alert" data-testid="onboarding-step2-error">
      {{ submitError }}
    </p>

    <button
      type="submit"
      class="onboarding-step__cta"
      :disabled="!canSubmit"
      data-testid="step2-next"
    >
      {{ mutation.isPending.value ? t("onboarding.step2.ctaLoading") : t("onboarding.step2.cta") }}
    </button>

    <div v-if="importEnabled" class="onboarding-step__alt">
      <span class="onboarding-step__alt-divider">{{ t("onboarding.step2.importOr") }}</span>
      <button
        type="button"
        class="onboarding-step__alt-btn"
        :disabled="mutation.isPending.value"
        data-testid="step2-import"
        @click="onImportPath"
      >
        <FileSpreadsheet :size="16" aria-hidden="true" />
        {{ t("onboarding.step2.importCta") }}
      </button>
      <span class="onboarding-step__alt-hint">{{ t("onboarding.step2.importHint") }}</span>
    </div>

    <button
      type="button"
      class="onboarding-step__skip"
      :disabled="mutation.isPending.value"
      data-testid="step2-skip"
      @click="onSkipStep"
    >
      {{ t("onboarding.step2.skipStep") }}
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
.onboarding-step__type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-1);
}
.onboarding-step__type-btn {
  padding: 8px var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.onboarding-step__type-btn.is-active {
  background: var(--color-brand-glow-xs);
  border-color: var(--color-brand-500);
  color: var(--color-text-primary);
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
.onboarding-step__alt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-1);
}
.onboarding-step__alt-divider {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: lowercase;
}
.onboarding-step__alt-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px var(--space-3);
  border: 1px solid var(--color-brand-500);
  border-radius: var(--radius-md);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.onboarding-step__alt-btn:hover:enabled {
  background: var(--color-bg-elevated);
  border-color: var(--color-brand-600);
}
.onboarding-step__alt-btn:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
.onboarding-step__alt-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.onboarding-step__alt-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-align: center;
}
.onboarding-step__skip {
  align-self: center;
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-decoration: underline;
  cursor: pointer;
}
.onboarding-step__skip:hover:enabled { color: var(--color-text-secondary); }
.onboarding-step__skip:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
.onboarding-step__skip:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
