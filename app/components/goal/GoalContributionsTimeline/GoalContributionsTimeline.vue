<script setup lang="ts">
import { computed } from "vue";

import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import UiEmptyState from "~/components/ui/UiEmptyState/UiEmptyState.vue";
import UiInlineError from "~/components/ui/UiInlineError/UiInlineError.vue";
import { formatCurrency } from "~/utils/currency";
import type { GoalContributionsTimelineProps } from "./GoalContributionsTimeline.types";

const props = withDefaults(defineProps<GoalContributionsTimelineProps>(), {
  items: () => [],
  loading: false,
  error: false,
});

const hasItems = computed(() => props.items.length > 0);

/**
 * Formats a YYYY-MM-DD date as a localised short pt-BR date.
 *
 * @param value ISO date string (YYYY-MM-DD).
 * @returns Formatted date like "01/06/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

/**
 * Formats a signed amount as BRL with an explicit +/− sign.
 *
 * @param amount Signed contribution amount.
 * @returns String such as "+ R$ 250,00" or "− R$ 50,00".
 */
const formatSigned = (amount: number): string => {
  const sign = amount < 0 ? "−" : "+";
  return `${sign} ${formatCurrency(Math.abs(amount))}`;
};
</script>

<template>
  <section class="goal-contributions-timeline" aria-label="Histórico de aportes">
    <UiInlineError
      v-if="props.error"
      :title="$t('goal.contribution.timeline.errorTitle')"
      :message="$t('goal.contribution.timeline.errorMessage')"
    />

    <div v-else-if="props.loading" class="goal-contributions-timeline__loading">
      <BaseSkeleton v-for="n in 3" :key="n" height="44px" />
    </div>

    <UiEmptyState
      v-else-if="!hasItems"
      icon="target"
      :title="$t('goal.contribution.timeline.emptyTitle')"
      :description="$t('goal.contribution.timeline.emptyDescription')"
      compact
    />

    <ol v-else class="goal-contributions-timeline__list">
      <li
        v-for="item in props.items"
        :key="item.id"
        class="goal-contributions-timeline__item"
      >
        <span class="goal-contributions-timeline__date">{{ formatDate(item.occurred_at) }}</span>
        <div class="goal-contributions-timeline__body">
          <span
            class="goal-contributions-timeline__amount"
            :class="item.amount < 0
              ? 'goal-contributions-timeline__amount--negative'
              : 'goal-contributions-timeline__amount--positive'"
          >
            {{ formatSigned(item.amount) }}
          </span>
          <span v-if="item.note" class="goal-contributions-timeline__note">{{ item.note }}</span>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.goal-contributions-timeline__loading {
  display: grid;
  gap: var(--space-2);
}

.goal-contributions-timeline__list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.goal-contributions-timeline__item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-outline-soft);
}

.goal-contributions-timeline__item:last-child {
  border-bottom: none;
}

.goal-contributions-timeline__date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.goal-contributions-timeline__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.goal-contributions-timeline__amount {
  font-weight: var(--font-weight-semibold);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

.goal-contributions-timeline__amount--positive {
  color: var(--color-positive);
}

.goal-contributions-timeline__amount--negative {
  color: var(--color-negative);
}

.goal-contributions-timeline__note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
</style>
