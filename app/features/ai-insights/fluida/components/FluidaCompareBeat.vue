<script setup lang="ts">
import type { FluidaCompareCard } from "../model/insight-fluida";

defineProps<{
  cards: readonly FluidaCompareCard[];
}>();
</script>

<template>
  <div class="fluida-compare">
    <article
      v-for="card in cards"
      :key="card.when"
      class="fluida-compare__card"
      :class="{ 'fluida-compare__card--neg': card.isNegative }"
    >
      <span class="fluida-compare__when">{{ card.when }}</span>
      <span class="fluida-compare__amount">{{ card.amountLabel }}</span>
      <span class="fluida-compare__text">{{ card.text }}</span>
    </article>
  </div>
</template>

<style scoped>
.fluida-compare {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.fluida-compare__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--fluida-radius-card);
  border-left: 3px solid var(--fluida-pos);
  background: var(--fluida-surface);
  box-shadow: var(--fluida-shadow);
}

.fluida-compare__card--neg {
  border-left-color: var(--fluida-neg);
}

.fluida-compare__when {
  font-size: var(--fluida-size-kicker);
  font-weight: var(--fluida-weight-heavy);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--fluida-muted);
}

.fluida-compare__amount {
  font-family: var(--fluida-font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--fluida-size-compare-amount);
  font-weight: var(--fluida-weight-strong);
  white-space: nowrap;
  color: var(--fluida-pos);
}

.fluida-compare__card--neg .fluida-compare__amount {
  color: var(--fluida-neg);
}

.fluida-compare__text {
  font-size: var(--fluida-size-caption);
  line-height: var(--fluida-leading-snug);
  color: var(--fluida-body);
}

@media (max-width: 720px) {
  .fluida-compare {
    grid-template-columns: 1fr;
  }
}
</style>
