<script setup lang="ts">
import { ArrowLeftRight } from "lucide-vue-next";

defineEmits<{ (e: "next"): void }>();

const { t } = useI18n();
</script>

<template>
  <div class="onboarding-step">
    <div class="onboarding-step__icon-wrap" aria-hidden="true">
      <ArrowLeftRight :size="40" />
    </div>
    <h2 class="onboarding-step__title">{{ t("onboarding.step2.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step2.description") }}</p>

    <ul class="onboarding-step__list">
      <li><strong>{{ t("onboarding.step2.point1Title") }}</strong> — {{ t("onboarding.step2.point1Body") }}</li>
      <li><strong>{{ t("onboarding.step2.point2Title") }}</strong> — {{ t("onboarding.step2.point2Body") }}</li>
      <li><strong>{{ t("onboarding.step2.point3Title") }}</strong> — {{ t("onboarding.step2.point3Body") }}</li>
    </ul>

    <button type="button" class="onboarding-step__cta" data-testid="step2-next" @click="$emit('next')">
      {{ t("onboarding.step2.cta") }}
    </button>
  </div>
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
.onboarding-step__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.onboarding-step__list li strong { color: var(--color-text-primary); }
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
.onboarding-step__cta:hover { background: var(--color-brand-500); }
</style>
