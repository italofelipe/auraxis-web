<script setup lang="ts">
import { Target } from "lucide-vue-next";

const emit = defineEmits<{
  (e: "complete"): void;
}>();

const { t } = useI18n();

/** Completes the wizard and navigates the user to the goals page. */
function onGoToGoals(): void {
  emit("complete");
  navigateTo("/goals");
}
</script>

<template>
  <div class="onboarding-step onboarding-step--goals">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <Target :size="48" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step3.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step3.description") }}</p>
    <ul class="onboarding-step__list" aria-label="O que você pode fazer com metas">
      <li>{{ t("onboarding.step3.benefit1") }}</li>
      <li>{{ t("onboarding.step3.benefit2") }}</li>
      <li>{{ t("onboarding.step3.benefit3") }}</li>
    </ul>
    <div class="onboarding-step__actions">
      <button type="button" class="onboarding-step__cta" @click="onGoToGoals">
        {{ t("onboarding.step3.ctaPrimary") }}
      </button>
      <button type="button" class="onboarding-step__cta-secondary" @click="emit('complete')">
        {{ t("onboarding.step3.ctaSecondary") }}
      </button>
    </div>
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

.onboarding-step__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: left;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.onboarding-step__list li::before {
  content: "✓ ";
  color: var(--color-positive-500, #22c55e);
  font-weight: var(--font-weight-bold);
}

.onboarding-step__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.onboarding-step__cta {
  padding: 12px var(--space-5);
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease;
}

.onboarding-step__cta:hover {
  background: var(--color-brand-500);
}

.onboarding-step__cta-secondary {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.onboarding-step__cta-secondary:hover {
  color: var(--color-text-secondary);
}
</style>
