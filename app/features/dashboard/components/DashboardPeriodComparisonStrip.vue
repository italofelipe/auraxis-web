<script setup lang="ts">
import { computed } from "vue";
import { ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-vue-next";
import type { DashboardComparison } from "~/features/dashboard/model/dashboard-overview";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiTrendBadge from "~/components/ui/UiTrendBadge/UiTrendBadge.vue";

const props = defineProps<{
  comparison: DashboardComparison | null;
  loading?: boolean;
}>();

const { t } = useI18n();

interface Item {
  readonly key: "income" | "expense" | "balance";
  readonly label: string;
  readonly icon: typeof ArrowUpCircle;
  readonly value: number | null;
  /**
   * For expenses, a positive delta is actually bad (spent more). Inverts the
   * direction that the trend badge uses to colour the value.
   */
  readonly inverted: boolean;
}

const items = computed<Item[]>(() => [
  {
    key: "income",
    label: t("pages.dashboard.comparisonStrip.income"),
    icon: ArrowUpCircle,
    value: props.comparison?.incomeVsPreviousMonthPercent ?? null,
    inverted: false,
  },
  {
    key: "expense",
    label: t("pages.dashboard.comparisonStrip.expense"),
    icon: ArrowDownCircle,
    value: props.comparison?.expenseVsPreviousMonthPercent ?? null,
    inverted: true,
  },
  {
    key: "balance",
    label: t("pages.dashboard.comparisonStrip.balance"),
    icon: Scale,
    value: props.comparison?.balanceVsPreviousMonthPercent ?? null,
    inverted: false,
  },
]);
</script>

<template>
  <UiSurfaceCard class="comparison-strip">
    <header class="comparison-strip__header">
      <h3 class="comparison-strip__title">
        {{ $t('pages.dashboard.comparisonStrip.title') }}
      </h3>
      <p class="comparison-strip__subtitle">
        {{ $t('pages.dashboard.comparisonStrip.subtitle') }}
      </p>
    </header>

    <div v-if="props.loading" class="comparison-strip__skeleton" aria-busy="true" />

    <ul v-else class="comparison-strip__list">
      <li v-for="item in items" :key="item.key" class="comparison-strip__item">
        <div class="comparison-strip__item-label">
          <component :is="item.icon" :size="16" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </div>
        <UiTrendBadge
          v-if="item.value !== null"
          :value="item.inverted ? -item.value : item.value"
          :decimals="1"
        />
        <span v-else class="comparison-strip__empty">
          {{ $t('pages.dashboard.comparisonStrip.noData') }}
        </span>
      </li>
    </ul>
  </UiSurfaceCard>
</template>

<style scoped>
.comparison-strip {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.comparison-strip__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.comparison-strip__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: var(--color-text-primary);
}
.comparison-strip__subtitle {
  font-size: var(--font-size-xs);
  margin: 0;
  color: var(--color-text-muted);
}
.comparison-strip__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin: 0;
}
.comparison-strip__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
}
.comparison-strip__item-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.comparison-strip__empty {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}
.comparison-strip__skeleton {
  height: 64px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (max-width: 640px) {
  .comparison-strip__list {
    grid-template-columns: 1fr;
  }
}
</style>
