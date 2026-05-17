<script setup lang="ts">
import { computed } from "vue";
import { NButton, NDataTable, NModal } from "naive-ui";
import { ChevronLeft, ChevronRight, GripVertical, TrendingDown, TrendingUp, WalletCards } from "lucide-vue-next";
import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import { useTransactionFilters } from "~/features/transactions/composables/useTransactionFilters";
import { useTransactionActions } from "~/features/transactions/composables/useTransactionActions";
import { useTransactionRecurrence } from "~/features/transactions/composables/useTransactionRecurrence";
import { useTransactionTable } from "~/features/transactions/composables/useTransactionTable";
import TransactionToolbar from "~/features/transactions/components/TransactionToolbar.vue";
import TransactionExportModal from "~/features/transactions/components/TransactionExportModal.vue";
import TransactionPaymentModal from "~/features/transactions/components/TransactionPaymentModal.vue";
import AiInsightButton from "~/features/ai-insights/components/AiInsightButton.vue";
import AiInsightSection from "~/features/ai-insights/components/AiInsightSection.vue";
import { useAIInsights } from "~/features/ai-insights/composables/useAIInsights";
import { formatCurrency } from "~/utils/currency";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Transações",
  pageSubtitle: "Receitas e despesas registradas",
});

useHead({ title: "Transações | Auraxis" });

// ── Filters / view state ───────────────────────────────────────────────────────

const {
  filterType, filterStatus, filterStartDate, filterEndDate, filterTagId,
  periodMode, periodLabel, periodRangeLabel, goToPreviousMonth, goToNextMonth,
  viewMode, selectedDay, showDayDetail, onDayClick,
  filters, TYPE_OPTIONS, STATUS_OPTIONS, tagOptions, tagMap, tagDetailMap, accountMap, clearFilters,
} = useTransactionFilters();

const showCreateTag = ref(false);
const showExportModal = ref(false);

// ── Query ─────────────────────────────────────────────────────────────────────

const { data, isLoading, isError, refetch } = useListTransactionsQuery(filters);
const aiInsights = useAIInsights();
const aiCurrentInsight = aiInsights.currentInsight;
const aiInsightMonth = aiInsights.insightMonth;
const aiInsightModel = aiInsights.insightModel;
const aiInsightTokensUsed = aiInsights.tokensUsed;
const aiInsightCostUsd = aiInsights.costUsd;
const aiInsightIsStale = aiInsights.isStale;

// ── Actions ───────────────────────────────────────────────────────────────────

const {
  showIncome, showExpense,
  deleteTarget, showDeleteConfirm, payTarget, showPayConfirm, editTarget, showEditModal,
  deleteMutation, markPaidMutation, duplicateMutation,
  handleDeleteClick, confirmDelete, handleMarkPaid, confirmMarkPaid, handleEdit, handleDuplicate, onTransactionCreated,
} = useTransactionActions(() => void refetch());

// ── Recurrence ────────────────────────────────────────────────────────────────

const dataComputed = computed(() => data.value);
const { visiblePatterns, handleRecurrenceDismiss, handleRecurrenceNever, handleRecurrenceConfirm } =
  useTransactionRecurrence(dataComputed, () => { showExpense.value = true; });

// ── Table ─────────────────────────────────────────────────────────────────────

const {
  reorderMode, tableData, totalIncome, totalExpense,
  columns, rowProps, rowKey, pagination, enterReorderMode, exitReorderMode,
} = useTransactionTable({
  data,
  tagMap,
  tagDetailMap,
  accountMap,
  filterType,
  filterStatus,
  filterStartDate,
  filterEndDate,
  filterTagId,
  deleteMutation,
  markPaidMutation,
  duplicateMutation,
  deleteTarget,
  onEdit: handleEdit,
  onMarkPaid: handleMarkPaid,
  onDelete: handleDeleteClick,
  onDuplicate: handleDuplicate,
});

const totalBalance = computed(() => totalIncome.value - totalExpense.value);
</script>

<template>
  <div class="transactions-page">

    <!-- ── Quick-add modals ─────────────────────────────────────────────────── -->
    <QuickTransactionForm :visible="showIncome" type="income" @update:visible="showIncome = $event" @success="onTransactionCreated" />
    <QuickTransactionForm :visible="showExpense" type="expense" @update:visible="showExpense = $event" @success="onTransactionCreated" />

    <!-- ── Edit modal ──────────────────────────────────────────────────────── -->
    <EditTransactionModal :visible="showEditModal" :transaction="editTarget" @update:visible="showEditModal = $event" @success="onTransactionCreated" />

    <!-- ── Create tag modal ───────────────────────────────────────────────── -->
    <CreateTagModal :visible="showCreateTag" @update:visible="showCreateTag = $event" />

    <!-- ── Delete confirmation ─────────────────────────────────────────────── -->
    <NModal :show="showDeleteConfirm" preset="dialog" type="error" :title="$t('transactions.action.delete')" :content="$t('transactions.action.deleteConfirm')" :positive-text="$t('transactions.action.deleteConfirmYes')" :negative-text="$t('transactions.action.deleteConfirmNo')" :loading="deleteMutation.isPending.value" @positive-click="confirmDelete" @negative-click="showDeleteConfirm = false" @close="showDeleteConfirm = false" />

    <!-- ── Pay / receipt confirmation ─────────────────────────────────────── -->
    <TransactionPaymentModal
      :visible="showPayConfirm"
      :transaction="payTarget"
      :loading="markPaidMutation.isPending.value"
      @update:visible="showPayConfirm = $event"
      @confirm="confirmMarkPaid"
    />

    <!-- ── Calendar day detail ─────────────────────────────────────────────── -->
    <CalendarDayDetail :day="selectedDay" :visible="showDayDetail" @update:visible="showDayDetail = $event" />

    <!-- ── Recurrence suggestions (PROD-13) ───────────────────────────────── -->
    <div v-if="visiblePatterns.length > 0" class="transactions-page__recurrence" aria-label="Sugestões de recorrência">
      <RecurrenceSuggestionCard v-for="pattern in visiblePatterns" :key="pattern.groupKey" :pattern="pattern" @confirm="handleRecurrenceConfirm" @dismiss="handleRecurrenceDismiss" @never="handleRecurrenceNever" />
    </div>

    <!-- ── Period header ───────────────────────────────────────────────────── -->
    <section class="transactions-page__period" aria-label="Período das transações">
      <div class="period-nav">
        <NButton circle secondary size="small" aria-label="Mês anterior" @click="goToPreviousMonth">
          <template #icon><ChevronLeft :size="18" /></template>
        </NButton>
        <div class="period-nav__body">
          <h2>{{ periodLabel }}</h2>
          <p>{{ periodMode === 'month' ? 'Período mensal selecionado' : 'Período customizado selecionado' }}</p>
        </div>
        <NButton circle secondary size="small" aria-label="Próximo mês" @click="goToNextMonth">
          <template #icon><ChevronRight :size="18" /></template>
        </NButton>
      </div>

      <div class="period-meta">
        <span class="period-meta__pill">{{ periodRangeLabel }}</span>
        <span class="period-meta__pill period-meta__pill--accent">{{ tableData.length }} transações</span>
      </div>
    </section>

    <!-- ── Summary strip ───────────────────────────────────────────────────── -->
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
      <div class="summary-card summary-card--balance">
        <WalletCards :size="18" class="summary-card__icon" />
        <div class="summary-card__body">
          <span class="summary-card__label">Resultado do período</span>
          <span class="summary-card__value" :class="{ 'summary-card__value--negative': totalBalance < 0 }">{{ formatCurrency(totalBalance) }}</span>
        </div>
      </div>
    </div>

    <!-- ── Toolbar ─────────────────────────────────────────────────────────── -->
    <TransactionToolbar
      v-model:filter-type="filterType"
      v-model:filter-status="filterStatus"
      v-model:filter-start-date="filterStartDate"
      v-model:filter-end-date="filterEndDate"
      v-model:filter-tag-id="filterTagId"
      v-model:view-mode="viewMode"
      :type-options="TYPE_OPTIONS"
      :status-options="STATUS_OPTIONS"
      :tag-options="tagOptions"
      :reorder-mode="reorderMode"
      @clear-filters="clearFilters"
      @enter-reorder="enterReorderMode"
      @exit-reorder="exitReorderMode"
      @add-income="showIncome = true"
      @add-expense="showExpense = true"
      @create-tag="showCreateTag = true"
      @open-trash="navigateTo('/transactions/trash')"
      @open-export="showExportModal = true"
    />

    <TransactionExportModal :visible="showExportModal" @update:visible="showExportModal = $event" />

    <!-- ── Reorder / swipe hints ───────────────────────────────────────────── -->
    <p v-if="reorderMode" class="transactions-page__reorder-hint">
      <GripVertical :size="12" /> {{ $t('transactions.reorder.hint') }}
    </p>
    <p v-if="!reorderMode" class="transactions-page__swipe-hint">
      {{ $t('transactions.swipe.payHint') }} &nbsp;·&nbsp; {{ $t('transactions.swipe.deleteHint') }}
    </p>

    <!-- ── Error / loading / empty ────────────────────────────────────────── -->
    <UiInlineError v-if="isError" :title="$t('transactions.loadError')" :message="$t('transactions.loadErrorMessage')" />
    <UiPageLoader v-else-if="isLoading" :rows="5" />
    <UiEmptyState v-else-if="tableData.length === 0" icon="transactions" :title="$t('transactions.empty.title')" :description="$t('transactions.empty.description')">
      <template #illustration>
        <IllustrationEmptyTransactions />
      </template>
      <template #action>
        <NButton type="primary" size="small" data-testid="transactions-empty-cta" @click="showIncome = true">{{ $t('transactions.empty.action') }}</NButton>
      </template>
    </UiEmptyState>

    <!-- ── Data table ──────────────────────────────────────────────────────── -->
    <NDataTable v-else-if="viewMode === 'list'" :columns="columns" :data="tableData" :loading="isLoading" :pagination="pagination" :row-key="rowKey" :row-props="rowProps" :scroll-x="780" size="small" class="transactions-page__table" />

    <!-- ── Financial calendar ──────────────────────────────────────────────── -->
    <FinancialCalendar v-else-if="viewMode === 'calendar'" class="transactions-page__calendar" @day-click="onDayClick" />

    <section class="transactions-page__ai-insights" aria-label="Insights de IA">
      <AiInsightButton />
      <AiInsightSection
        v-if="aiCurrentInsight"
        :insight="aiCurrentInsight"
        :month="aiInsightMonth"
        :is-stale="aiInsightIsStale"
        :model="aiInsightModel"
        :tokens-used="aiInsightTokensUsed"
        :cost-usd="aiInsightCostUsd"
      />
    </section>

  </div>
</template>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.transactions-page__recurrence { display: grid; gap: var(--space-2); }
.transactions-page__calendar { width: 100%; }

.transactions-page__period {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 92%, transparent), var(--color-bg-elevated)),
    var(--color-bg-elevated);
}

.period-nav,
.period-meta {
  display: flex;
  align-items: center;
}

.period-nav {
  gap: var(--space-2);
  min-width: 0;
}

.period-nav__body {
  min-width: 0;
}

.period-nav__body h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2vw, 2rem);
  line-height: 1.1;
  color: var(--color-text-primary);
}

.period-nav__body p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
}

.period-meta {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.period-meta__pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-full, 999px);
  color: var(--color-text-muted);
  background: var(--color-bg-surface);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.period-meta__pill--accent {
  color: var(--color-brand-400);
  border-color: color-mix(in srgb, var(--color-brand-500) 42%, transparent);
  background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
}

.transactions-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
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

.summary-card--income .summary-card__icon { color: var(--color-positive); }
.summary-card--expense .summary-card__icon { color: var(--color-negative); }
.summary-card--balance .summary-card__icon { color: var(--color-brand-400); }
.summary-card__body { display: flex; flex-direction: column; gap: 2px; }
.summary-card__label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.summary-card__value { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.summary-card__value--negative { color: var(--color-negative); }

.transactions-page__reorder-hint,
.transactions-page__swipe-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.transactions-page__swipe-hint { display: none; }
@media (pointer: coarse) { .transactions-page__swipe-hint { display: flex; } }

.transactions-page__table {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  overflow: hidden;
}

.transactions-page__ai-insights {
  display: grid;
  gap: var(--space-3);
  align-items: start;
}

.transactions-page__table :deep(.tx-table-row) { cursor: default; transition: background-color 0.15s ease, transform 0.12s ease; }
.transactions-page__table :deep(.tx-table-row:hover) { background-color: var(--color-bg-elevated) !important; }
.transactions-page__table :deep(.tx-table-row--dragging) { opacity: 0.45; cursor: grabbing; }
.transactions-page__table :deep(.tx-table-row--drag-over) { background-color: color-mix(in srgb, var(--color-brand-500) 8%, transparent) !important; border-top: 2px solid var(--color-brand-500); }
.transactions-page__table :deep(.tx-table-row--swiping-right) { background-color: color-mix(in srgb, var(--color-positive) 10%, transparent) !important; }
.transactions-page__table :deep(.tx-table-row--swiping-left) { background-color: color-mix(in srgb, var(--color-negative) 10%, transparent) !important; }

:deep(.tx-status-icon) { display: block; }
:deep(.tx-status-icon--paid) { color: var(--color-positive); }
:deep(.tx-status-icon--overdue) { color: var(--color-negative); }
:deep(.tx-status-icon--near-due) { color: var(--color-warning, #f0a020); }
:deep(.tx-status-icon--pending) { color: var(--color-text-muted); }
:deep(.tx-amount) { font-weight: var(--font-weight-semibold); white-space: nowrap; }
:deep(.tx-amount--income) { color: var(--color-positive); }
:deep(.tx-amount--expense) { color: var(--color-negative); }
:deep(.tx-title-cell) { display: flex; flex-direction: column; gap: 2px; }
:deep(.tx-title-cell__name) { font-size: var(--font-size-sm); color: var(--color-text-primary); }
:deep(.tx-badge) { display: inline-flex; align-items: center; gap: 3px; font-size: var(--font-size-xs); color: var(--color-text-muted); }
:deep(.tx-drag-handle) { display: flex; align-items: center; justify-content: center; cursor: grab; color: var(--color-text-muted); }
:deep(.tx-drag-handle):active { cursor: grabbing; }
:deep(.tx-tag-badge) { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full, 9999px); font-size: var(--font-size-xs); font-weight: var(--font-weight-medium, 500); line-height: 1.4; white-space: nowrap; }

@media (max-width: 640px) {
  .transactions-page {
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .transactions-page__period {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .period-meta {
    justify-content: flex-start;
  }

  .transactions-page__summary { grid-template-columns: 1fr; }
}
</style>
