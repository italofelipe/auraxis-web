<script setup lang="ts">
import { Briefcase, Wrench } from "lucide-vue-next";

defineEmits<{ (e: "complete"): void }>();

const { t } = useI18n();
</script>

<template>
  <div class="onboarding-step">
    <h2 class="onboarding-step__title">{{ t("onboarding.step4.title") }}</h2>
    <p class="onboarding-step__description">{{ t("onboarding.step4.description") }}</p>

    <div class="onboarding-step__grid">
      <article class="onboarding-step__card">
        <header>
          <span class="onboarding-step__card-icon" aria-hidden="true"><Wrench :size="20" /></span>
          <strong>{{ t("onboarding.step4.toolsTitle") }}</strong>
        </header>
        <p>{{ t("onboarding.step4.toolsBody") }}</p>
      </article>
      <article class="onboarding-step__card">
        <header>
          <span class="onboarding-step__card-icon" aria-hidden="true"><Briefcase :size="20" /></span>
          <strong>{{ t("onboarding.step4.portfolioTitle") }}</strong>
        </header>
        <p>{{ t("onboarding.step4.portfolioBody") }}</p>
      </article>
    </div>

    <p class="onboarding-step__tip">{{ t("onboarding.step4.tip") }}</p>

    <button type="button" class="onboarding-step__cta" data-testid="step4-complete" @click="$emit('complete')">
      {{ t("onboarding.step4.cta") }}
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
.onboarding-step__grid {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 520px) {
  .onboarding-step__grid { grid-template-columns: 1fr; }
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
.onboarding-step__card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.5;
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
  background: var(--color-positive);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.onboarding-step__cta:hover { filter: brightness(1.08); }
</style>
