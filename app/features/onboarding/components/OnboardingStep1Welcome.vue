<script setup lang="ts">
import { ArrowLeftRight, Target, Wrench } from "lucide-vue-next";

defineEmits<{ (e: "next"): void }>();

const { t } = useI18n();
</script>

<template>
  <div class="onboarding-step">
    <h2 class="onboarding-step__title">{{ t("onboarding.step1.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step1.description") }}</p>

    <ul class="onboarding-step__pillars" aria-label="Pilares do Auraxis">
      <li class="onboarding-step__pillar">
        <span class="onboarding-step__pillar-icon" aria-hidden="true"><ArrowLeftRight :size="22" /></span>
        <div>
          <strong>{{ t("onboarding.step1.pillarTransactionsTitle") }}</strong>
          <p>{{ t("onboarding.step1.pillarTransactionsBody") }}</p>
        </div>
      </li>
      <li class="onboarding-step__pillar">
        <span class="onboarding-step__pillar-icon" aria-hidden="true"><Target :size="22" /></span>
        <div>
          <strong>{{ t("onboarding.step1.pillarGoalsTitle") }}</strong>
          <p>{{ t("onboarding.step1.pillarGoalsBody") }}</p>
        </div>
      </li>
      <li class="onboarding-step__pillar">
        <span class="onboarding-step__pillar-icon" aria-hidden="true"><Wrench :size="22" /></span>
        <div>
          <strong>{{ t("onboarding.step1.pillarToolsTitle") }}</strong>
          <p>{{ t("onboarding.step1.pillarToolsBody") }}</p>
        </div>
      </li>
    </ul>

    <button type="button" class="onboarding-step__cta" data-testid="step1-next" @click="$emit('next')">
      {{ t("onboarding.step1.cta") }}
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
.onboarding-step__pillars {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-2);
}
.onboarding-step__pillar {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: var(--space-2);
  align-items: start;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.onboarding-step__pillar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
}
.onboarding-step__pillar strong {
  display: block;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
.onboarding-step__pillar p {
  margin: 2px 0 0;
  color: var(--color-text-muted);
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
.onboarding-step__cta:hover { background: var(--color-brand-500); }
</style>
