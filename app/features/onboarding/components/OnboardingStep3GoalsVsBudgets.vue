<script setup lang="ts">
import { PiggyBank, Target } from "lucide-vue-next";

defineEmits<{ (e: "next"): void }>();

const { t } = useI18n();
</script>

<template>
  <div class="onboarding-step">
    <h2 class="onboarding-step__title">{{ t("onboarding.step3.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step3.description") }}</p>

    <div class="onboarding-step__comparison">
      <article class="onboarding-step__card">
        <header>
          <span class="onboarding-step__card-icon" aria-hidden="true"><Target :size="20" /></span>
          <strong>{{ t("onboarding.step3.goalTitle") }}</strong>
        </header>
        <p class="onboarding-step__card-definition">{{ t("onboarding.step3.goalDefinition") }}</p>
        <p class="onboarding-step__card-example">
          <span class="onboarding-step__card-example-label">{{ t("onboarding.step3.example") }}</span>
          {{ t("onboarding.step3.goalExample") }}
        </p>
      </article>

      <article class="onboarding-step__card">
        <header>
          <span class="onboarding-step__card-icon" aria-hidden="true"><PiggyBank :size="20" /></span>
          <strong>{{ t("onboarding.step3.budgetTitle") }}</strong>
        </header>
        <p class="onboarding-step__card-definition">{{ t("onboarding.step3.budgetDefinition") }}</p>
        <p class="onboarding-step__card-example">
          <span class="onboarding-step__card-example-label">{{ t("onboarding.step3.example") }}</span>
          {{ t("onboarding.step3.budgetExample") }}
        </p>
      </article>
    </div>

    <p class="onboarding-step__tip">{{ t("onboarding.step3.tip") }}</p>

    <button type="button" class="onboarding-step__cta" data-testid="step3-next" @click="$emit('next')">
      {{ t("onboarding.step3.cta") }}
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
.onboarding-step__comparison {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 520px) {
  .onboarding-step__comparison { grid-template-columns: 1fr; }
}
.onboarding-step__card {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.onboarding-step__card header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
.onboarding-step__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
}
.onboarding-step__card-definition {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.onboarding-step__card-example {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.onboarding-step__card-example-label {
  display: inline-block;
  margin-right: 4px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.onboarding-step__tip {
  margin: 0;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-brand-glow-xs);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  line-height: 1.5;
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
