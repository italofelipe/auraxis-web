<script setup lang="ts">
import { NButton, NCard, NTag } from "naive-ui";
import { CheckCircle2 } from "lucide-vue-next";

interface Props {
  /** Plan identifier slug. */
  planSlug: string;
  /** Display name for the plan. */
  name: string;
  /** Price label to display (e.g. "R$ 29,90/mês"). */
  priceLabel: string;
  /** List of features included in this plan. */
  features: string[];
  /** Whether the user is currently on this plan. */
  isCurrent?: boolean;
  /** Whether the plan offers a free trial. */
  hasTrial?: boolean;
  /** Whether the CTA button is in a loading state. */
  loading?: boolean;
}

interface Emits {
  /** Emitted when the user clicks the plan CTA. */
  (e: "select", planSlug: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  isCurrent: false,
  hasTrial: false,
  loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Returns the appropriate CTA label based on plan context.
 *
 * @returns CTA button label string.
 */
const ctaLabel = computed((): string => {
  if (props.isCurrent) { return "Você está aqui"; }
  if (props.hasTrial) { return "Iniciar trial"; }
  return "Assinar";
});

/**
 * Handles the CTA click, emitting select with the plan slug.
 */
const handleSelect = (): void => {
  if (!props.isCurrent) {
    emit("select", props.planSlug);
  }
};
</script>

<template>
  <NCard class="plan-card" :class="{ 'plan-card--current': isCurrent }">
    <div class="plan-card__header">
      <h3 class="plan-card__name">
        {{ name }}
      </h3>
      <NTag v-if="isCurrent" type="success" size="small">
        Plano atual
      </NTag>
    </div>

    <p class="plan-card__price">
      {{ priceLabel }}
    </p>

    <ul class="plan-card__features">
      <li v-for="feature in features" :key="feature" class="plan-card__feature-item">
        <CheckCircle2 class="plan-card__feature-icon" aria-hidden="true" />
        {{ feature }}
      </li>
    </ul>

    <NButton
      class="plan-card__cta"
      :type="isCurrent ? 'default' : 'primary'"
      :disabled="isCurrent"
      :loading="loading"
      block
      @click="handleSelect"
    >
      {{ ctaLabel }}
    </NButton>
  </NCard>
</template>

<style scoped>
.plan-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.plan-card--current {
  border: 2px solid var(--color-brand-500, #ffab1a);
}

.plan-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2, 8px);
}

.plan-card__name {
  margin: 0;
  font-size: var(--font-size-heading-sm, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
}

.plan-card__price {
  margin: 0;
  font-size: var(--font-size-heading-md, 1.375rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-brand-500, #ffab1a);
}

.plan-card__features {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-1, 4px);
  flex: 1;
}

.plan-card__feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-1, 4px);
  font-size: var(--font-size-body-sm, 0.875rem);
  color: var(--color-neutral-700, #444);
}

.plan-card__feature-icon {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  color: var(--color-brand-500, #ffab1a);
}

.plan-card__cta {
  margin-top: auto;
}
</style>
