<script setup lang="ts">
import { formatCurrency } from "~/utils/currency";
import type {
  DashboardTransactionTab,
  DashboardTransactionsPanelProps,
} from "./DashboardTransactionsPanel.types";

const { t } = useI18n();

const props = defineProps<DashboardTransactionsPanelProps>();

const activeTab = ref<DashboardTransactionTab>("dues");

const TAB_OPTIONS = computed(() => [
  { value: "dues" as DashboardTransactionTab, label: t("dashboard.transactions.dues") },
  { value: "expenses" as DashboardTransactionTab, label: t("dashboard.transactions.expenses") },
]);

/**
 * Formats an ISO date string to a short localised display value.
 *
 * @param value - ISO date string (YYYY-MM-DD).
 * @returns Short pt-BR date like "20 mar. 2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const panelTitle = computed(() =>
  activeTab.value === "dues" ? t("dashboard.transactions.upcomingDues") : t("dashboard.transactions.byCategory"),
);
</script>

<template>
  <UiListPanel :title="panelTitle" :loading="props.isLoading">
    <template #filters>
      <UiSegmentedControl
        v-model="activeTab"
        :options="TAB_OPTIONS"
        :aria-label="$t('dashboard.transactions.tabAriaLabel')"
      />
    </template>

    <template v-if="activeTab === 'dues'">
      <UiEmptyState
        v-if="props.upcomingDues.length === 0"
        icon="calendarCheck"
        :title="$t('dashboard.transactions.noDues.title')"
        :description="$t('dashboard.transactions.noDues.description')"
        :compact="true"
      />
      <article
        v-for="due in props.upcomingDues"
        :key="due.id"
        class="transaction-row"
      >
        <div class="transaction-row__info">
          <span class="transaction-row__description">{{ due.description }}</span>
          <span class="transaction-row__meta">
            {{ due.category ?? $t('dashboard.transactions.noCategory') }} · {{ formatDate(due.dueDate) }}
          </span>
        </div>
        <strong class="transaction-row__amount">
          {{ formatCurrency(due.amount) }}
        </strong>
      </article>
    </template>

    <template v-else>
      <UiEmptyState
        v-if="props.expensesByCategory.length === 0"
        icon="pieChart"
        :title="$t('dashboard.transactions.noExpenses.title')"
        :description="$t('dashboard.transactions.noExpenses.description')"
        :compact="true"
      />
      <article
        v-for="cat in props.expensesByCategory"
        :key="cat.category"
        class="category-row"
      >
        <div class="category-row__header">
          <span class="category-row__name">{{ cat.category }}</span>
          <span class="category-row__pct">{{ cat.percentage.toFixed(1) }}%</span>
        </div>
        <div class="category-row__bar-track" aria-hidden="true">
          <span
            class="category-row__bar-fill"
            :style="{ width: `${Math.min(cat.percentage, 100)}%` }"
          />
        </div>
        <span class="category-row__amount">{{ formatCurrency(cat.amount) }}</span>
      </article>
    </template>
  </UiListPanel>
</template>

<style scoped>
/* ── Upcoming due row ──────────────────────────────────────────── */
.transaction-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.transaction-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.transaction-row__description {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transaction-row__meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.transaction-row__amount {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* ── Expense category row ──────────────────────────────────────── */
.category-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.category-row__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-row__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.category-row__pct {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.category-row__bar-track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
  overflow: hidden;
}

.category-row__bar-fill {
  display: block;
  height: 6px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    var(--color-brand-600) 0%,
    var(--color-brand-500) 100%
  );
  transition: width 0.3s ease;
}

.category-row__amount {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
