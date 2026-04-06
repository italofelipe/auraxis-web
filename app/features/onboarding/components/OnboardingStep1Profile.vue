<script setup lang="ts">
import { User } from "lucide-vue-next";

const emit = defineEmits<{
  (e: "next"): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="onboarding-step onboarding-step--profile">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <User :size="48" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step1.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step1.description") }}</p>
    <ul class="onboarding-step__list" aria-label="Benefícios">
      <li>{{ t("onboarding.step1.benefit1") }}</li>
      <li>{{ t("onboarding.step1.benefit2") }}</li>
      <li>{{ t("onboarding.step1.benefit3") }}</li>
    </ul>
    <button type="button" class="onboarding-step__cta" @click="emit('next')">
      {{ t("onboarding.step1.cta") }}
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

.onboarding-step__cta {
  margin-top: var(--space-2);
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
</style>
