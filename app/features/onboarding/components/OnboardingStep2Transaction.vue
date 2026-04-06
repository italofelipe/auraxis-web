<script setup lang="ts">
import { ArrowLeftRight } from "lucide-vue-next";

const emit = defineEmits<{
  (e: "next"): void;
}>();

const { t } = useI18n();

const isQuickAddOpen = ref(false);

/** Handles a successful transaction save: closes the quick-add and advances the wizard. */
function onTransactionSaved(): void {
  isQuickAddOpen.value = false;
  emit("next");
}
</script>

<template>
  <div class="onboarding-step onboarding-step--transaction">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <ArrowLeftRight :size="48" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step2.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step2.description") }}</p>
    <div class="onboarding-step__actions">
      <DashboardQuickAdd @success="onTransactionSaved" />
    </div>
    <button type="button" class="onboarding-step__skip-step" @click="emit('next')">
      {{ t("onboarding.step2.skipStep") }}
    </button>
  </div>
</template>

<style scoped>
.onboarding-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-4) 0;
}

.onboarding-step__icon-wrap {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-50, rgba(99, 102, 241, 0.1));
  border-radius: var(--radius-full);
  color: var(--color-brand-600);
}

.onboarding-step__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.onboarding-step__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 340px;
  margin: 0;
}

.onboarding-step__actions {
  margin-top: var(--space-2);
}

.onboarding-step__skip-step {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.onboarding-step__skip-step:hover {
  color: var(--color-text-secondary);
}
</style>
