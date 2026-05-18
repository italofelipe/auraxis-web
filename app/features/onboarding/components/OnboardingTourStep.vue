<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";

interface TourItem {
  readonly title: string;
  readonly text: string;
}

defineProps<{
  title: string;
  description: string;
  items: readonly TourItem[];
  cta: string;
}>();

const emit = defineEmits<{ next: [] }>();
</script>

<template>
  <section class="onboarding-tour-step" data-testid="onboarding-tour-step">
    <div class="onboarding-tour-step__icon" aria-hidden="true">
      <Sparkles :size="32" />
    </div>

    <h2 class="onboarding-tour-step__title">{{ title }}</h2>
    <p class="onboarding-tour-step__description">{{ description }}</p>

    <div class="onboarding-tour-step__items">
      <article v-for="item in items" :key="item.title" class="onboarding-tour-step__item">
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </article>
    </div>

    <button type="button" class="onboarding-tour-step__cta" data-testid="onboarding-tour-next" @click="emit('next')">
      {{ cta }}
    </button>
  </section>
</template>

<style scoped>
.onboarding-tour-step {
  display: grid;
  gap: var(--space-3);
  width: 100%;
}

.onboarding-tour-step__icon {
  justify-self: center;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
}

.onboarding-tour-step__title {
  margin: 0;
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.onboarding-tour-step__description {
  margin: 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.onboarding-tour-step__items {
  display: grid;
  gap: var(--space-2);
}

.onboarding-tour-step__item {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  background: rgba(255, 255, 255, 0.025);
}

.onboarding-tour-step__item h3 {
  margin: 0 0 4px;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.onboarding-tour-step__item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-body-sm);
}

.onboarding-tour-step__cta {
  justify-self: center;
  margin-top: var(--space-1);
  min-height: 42px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.onboarding-tour-step__cta:hover {
  background: var(--color-brand-500);
}
</style>
