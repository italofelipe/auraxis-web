<script setup lang="ts">
import {
  NSelect,
  NButton,
  NTag,
  type SelectOption,
} from "naive-ui";
import {
  ArrowDownUp,
  ArrowUpDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-vue-next";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import type {
  TransactionDto,
  TransactionStatusDto,
  TransactionTypeDto,
} from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Transações",
  pageSubtitle: "Receitas e despesas registradas",
});

useHead({ title: "Transações | Auraxis" });

// ── Filter state ──────────────────────────────────────────────────────────────

type FilterType = TransactionTypeDto | "all";
type FilterStatus = TransactionStatusDto | "all";
type SortKey = "due_date" | "amount" | "title" | "status" | "is_recurring";
type SortDir = "asc" | "desc";

const filterType = ref<FilterType>("all");
const filterStatus = ref<FilterStatus>("all");

const sortKey = ref<SortKey>("due_date");
const sortDir = ref<SortDir>("desc");

// ── Quick-add modal ───────────────────────────────────────────────────────────

const showIncome = ref(false);
const showExpense = ref(false);

// ── Query ─────────────────────────────────────────────────────────────────────

const { data, isLoading, isError, refetch } = useListTransactionsQuery();

// ── Computed options ──────────────────────────────────────────────────────────

const TYPE_OPTIONS = computed((): SelectOption[] => [
  { label: t("transactions.filter.all"), value: "all" },
  { label: t("transactions.filter.income"), value: "income" },
  { label: t("transactions.filter.expense"), value: "expense" },
]);

const STATUS_OPTIONS = computed((): SelectOption[] => [
  { label: t("transactions.filter.all"), value: "all" },
  { label: t("transaction.status.pending"), value: "pending" },
  { label: t("transaction.status.paid"), value: "paid" },
  { label: t("transaction.status.overdue"), value: "overdue" },
  { label: t("transaction.status.cancelled"), value: "cancelled" },
  { label: t("transaction.status.postponed"), value: "postponed" },
]);

const SORT_OPTIONS = computed((): SelectOption[] => [
  { label: t("transactions.sort.date"), value: "due_date" },
  { label: t("transactions.sort.amount"), value: "amount" },
  { label: t("transactions.sort.title"), value: "title" },
  { label: t("transactions.sort.status"), value: "status" },
  { label: t("transactions.sort.recurring"), value: "is_recurring" },
]);

// ── Processed list ────────────────────────────────────────────────────────────

const processedTransactions = computed((): TransactionDto[] => {
  let list = data.value ?? [];

  if (filterType.value !== "all") {
    list = list.filter((tx) => tx.type === filterType.value);
  }

  if (filterStatus.value !== "all") {
    list = list.filter((tx) => tx.status === filterStatus.value);
  }

  const dir = sortDir.value === "asc" ? 1 : -1;

  list = [...list].sort((a, b) => {
    switch (sortKey.value) {
      case "due_date":
        return dir * a.due_date.localeCompare(b.due_date);
      case "amount":
        return dir * (parseFloat(a.amount) - parseFloat(b.amount));
      case "title":
        return dir * a.title.localeCompare(b.title, "pt-BR");
      case "status":
        return dir * a.status.localeCompare(b.status);
      case "is_recurring":
        return dir * (Number(b.is_recurring) - Number(a.is_recurring));
      default:
        return 0;
    }
  });

  return list;
});

const totalIncome = computed(() =>
  (data.value ?? [])
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
);

const totalExpense = computed(() =>
  (data.value ?? [])
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string (YYYY-MM-DD) as a localised short date.
 *
 * @param isoDate ISO 8601 date string.
 * @returns Formatted date like "20/03/2026".
 */
const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

/**
 * Returns the Naive UI tag type for a given transaction status.
 *
 * @param status Transaction lifecycle status.
 * @returns Naive UI tag type string.
 */
const statusTagType = (
  status: TransactionStatusDto,
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "paid": return "success";
    case "pending": return "warning";
    case "overdue": return "error";
    case "cancelled": return "default";
    case "postponed": return "default";
    default: return "default";
  }
};

/**
 * Returns a localised label for the given transaction status.
 *
 * @param status Transaction lifecycle status.
 * @returns Localised status label.
 */
const statusLabel = (status: TransactionStatusDto): string =>
  t(`transaction.status.${status}`);

/** Toggles the sort direction between asc and desc. */
const toggleSortDir = (): void => {
  sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
};

/** Called by the quick-add modal on successful transaction creation. */
const onTransactionCreated = (): void => {
  void refetch();
};
</script>

<template>
  <div class="transactions-page">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="transactions-page__header">
      <div class="transactions-page__title-block">
        <span class="transactions-page__title">{{ $t('transactions.title') }}</span>
        <span class="transactions-page__subtitle">{{ $t('transactions.subtitle') }}</span>
      </div>
      <div class="transactions-page__header-actions">
        <NButton size="small" @click="showIncome = true">
          <template #icon><TrendingUp :size="14" /></template>
          {{ $t('transactions.addIncome') }}
        </NButton>
        <NButton type="primary" size="small" @click="showExpense = true">
          <template #icon><TrendingDown :size="14" /></template>
          {{ $t('transactions.addExpense') }}
        </NButton>
      </div>
    </div>

    <!-- ── Quick-add modals (reuse existing form) ──────────────────────────── -->
    <QuickTransactionForm
      :visible="showIncome"
      type="income"
      @update:visible="showIncome = $event"
      @success="onTransactionCreated"
    />
    <QuickTransactionForm
      :visible="showExpense"
      type="expense"
      @update:visible="showExpense = $event"
      @success="onTransactionCreated"
    />

    <!-- ── Summary cards ──────────────────────────────────────────────────── -->
    <div class="transactions-page__summary">
      <div class="summary-card summary-card--income">
        <TrendingUp :size="18" class="summary-card__icon" />
        <div class="summary-card__body">
          <span class="summary-card__label">{{ $t('transactions.summary.income') }}</span>
          <span class="summary-card__value">{{ formatCurrency(totalIncome) }}</span>
        </div>
      </div>
      <div class="summary-card summary-card--expense">
        <TrendingDown :size="18" class="summary-card__icon" />
        <div class="summary-card__body">
          <span class="summary-card__label">{{ $t('transactions.summary.expense') }}</span>
          <span class="summary-card__value">{{ formatCurrency(totalExpense) }}</span>
        </div>
      </div>
    </div>

    <!-- ── Filter / sort bar ──────────────────────────────────────────────── -->
    <div class="transactions-page__toolbar">
      <NSelect
        v-model:value="filterType"
        :options="TYPE_OPTIONS"
        size="small"
        style="min-width: 130px"
      />
      <NSelect
        v-model:value="filterStatus"
        :options="STATUS_OPTIONS"
        size="small"
        style="min-width: 140px"
      />
      <NSelect
        v-model:value="sortKey"
        :options="SORT_OPTIONS"
        size="small"
        style="min-width: 140px"
      />
      <NButton
        size="small"
        :title="sortDir === 'asc' ? $t('transactions.sort.asc') : $t('transactions.sort.desc')"
        @click="toggleSortDir"
      >
        <template #icon>
          <ArrowUpDown v-if="sortDir === 'asc'" :size="14" />
          <ArrowDownUp v-else :size="14" />
        </template>
      </NButton>
    </div>

    <!-- ── Error state ────────────────────────────────────────────────────── -->
    <UiInlineError
      v-if="isError"
      :title="$t('transactions.loadError')"
      :message="$t('transactions.loadErrorMessage')"
    />

    <!-- ── Loading state ─────────────────────────────────────────────────── -->
    <UiPageLoader v-else-if="isLoading" :rows="5" />

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <UiEmptyState
      v-else-if="processedTransactions.length === 0"
      icon="transactions"
      :title="$t('transactions.empty.title')"
      :description="$t('transactions.empty.description')"
    >
      <template #action>
        <NButton type="primary" size="small" @click="showIncome = true">
          {{ $t('transactions.addIncome') }}
        </NButton>
      </template>
    </UiEmptyState>

    <!-- ── Transaction list ───────────────────────────────────────────────── -->
    <div v-else class="transactions-page__list">
      <article
        v-for="tx in processedTransactions"
        :key="tx.id"
        class="tx-row"
        :class="{
          'tx-row--income': tx.type === 'income',
          'tx-row--expense': tx.type === 'expense',
        }"
      >
        <!-- Type indicator -->
        <div class="tx-row__indicator" aria-hidden="true">
          <TrendingUp v-if="tx.type === 'income'" :size="14" />
          <TrendingDown v-else :size="14" />
        </div>

        <!-- Main info -->
        <div class="tx-row__body">
          <div class="tx-row__top">
            <span class="tx-row__title">{{ tx.title }}</span>
            <span
              class="tx-row__amount"
              :class="tx.type === 'income' ? 'tx-row__amount--income' : 'tx-row__amount--expense'"
            >
              {{ tx.type === 'expense' ? '−' : '+' }}{{ formatCurrency(parseFloat(tx.amount)) }}
            </span>
          </div>
          <div class="tx-row__meta">
            <span class="tx-row__date">{{ formatDate(tx.due_date) }}</span>
            <NTag :type="statusTagType(tx.status as TransactionStatusDto)" size="tiny" round>
              {{ statusLabel(tx.status as TransactionStatusDto) }}
            </NTag>
            <span v-if="tx.is_recurring" class="tx-row__badge">
              <RefreshCw :size="10" />
              {{ $t('transactions.recurring') }}
            </span>
            <span v-if="tx.is_installment" class="tx-row__badge">
              {{ $t('transactions.installment', { count: tx.installment_count }) }}
            </span>
          </div>
        </div>
      </article>

      <!-- Count -->
      <p class="transactions-page__count">
        {{ $t('transactions.count', { n: processedTransactions.length }) }}
      </p>
    </div>

  </div>
</template>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.transactions-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.transactions-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transactions-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.transactions-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.transactions-page__header-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* ── Summary cards ─────────────────────────────────────────────────────────── */
.transactions-page__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
}

.summary-card--income .summary-card__icon {
  color: var(--color-positive);
}

.summary-card--expense .summary-card__icon {
  color: var(--color-negative);
}

.summary-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-card__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-card__value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* ── Toolbar ───────────────────────────────────────────────────────────────── */
.transactions-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

/* ── List ──────────────────────────────────────────────────────────────────── */
.transactions-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tx-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
}

.tx-row__indicator {
  flex-shrink: 0;
  margin-top: 2px;
}

.tx-row--income .tx-row__indicator {
  color: var(--color-positive);
}

.tx-row--expense .tx-row__indicator {
  color: var(--color-negative);
}

.tx-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tx-row__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.tx-row__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-row__amount {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  flex-shrink: 0;
}

.tx-row__amount--income {
  color: var(--color-positive);
}

.tx-row__amount--expense {
  color: var(--color-negative);
}

.tx-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tx-row__date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tx-row__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Count ─────────────────────────────────────────────────────────────────── */
.transactions-page__count {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-top: var(--space-1);
}

@media (max-width: 480px) {
  .transactions-page__summary {
    grid-template-columns: 1fr;
  }

  .transactions-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
