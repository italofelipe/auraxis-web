<script setup lang="ts">
import { computed, h, ref, type VNode } from "vue";
import { NButton, NDataTable, NModal, useMessage, type DataTableColumns } from "naive-ui";
import { ArrowLeft, RotateCcw, TrendingDown, TrendingUp } from "lucide-vue-next";
import { formatTransactionDate } from "~/features/transactions/composables/useTransactionTable";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { useListDeletedTransactionsQuery } from "~/features/transactions/queries/use-list-deleted-transactions-query";
import { useRestoreTransactionMutation } from "~/features/transactions/queries/use-restore-transaction-mutation";
import { formatCurrency } from "~/utils/currency";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Lixeira de transações",
  pageSubtitle: "Transações excluídas recentemente",
});

useHead({ title: "Lixeira | Auraxis" });

const { t } = useI18n();
const message = useMessage();

const { data, isLoading, isError } = useListDeletedTransactionsQuery();
const restoreMutation = useRestoreTransactionMutation();

const restoreTarget = ref<TransactionDto | null>(null);
const showRestoreConfirm = ref(false);

const tableData = computed<TransactionDto[]>(() => data.value ?? []);

/**
 * Prompts for confirmation before restoring the given transaction.
 *
 * @param row Transaction to restore.
 */
function onRestoreClick(row: TransactionDto): void {
  restoreTarget.value = row;
  showRestoreConfirm.value = true;
}

/** Executes the restore once the user confirms. */
function onConfirmRestore(): void {
  const target = restoreTarget.value;
  if (!target) { return; }
  restoreMutation.mutate(target.id, {
    onSuccess: (): void => {
      message.success(t("transactions.trash.restoreSuccess"));
      showRestoreConfirm.value = false;
      restoreTarget.value = null;
    },
    onError: (): void => {
      message.error(t("transactions.trash.restoreError"));
    },
  });
}

/** Closes the confirmation modal without restoring. */
function onCancelRestore(): void {
  showRestoreConfirm.value = false;
  restoreTarget.value = null;
}

const columns = computed<DataTableColumns<TransactionDto>>(() => [
  {
    key: "type",
    title: "",
    width: 40,
    render: (row): VNode =>
      row.type === "income"
        ? h(TrendingUp, { size: 16, class: "tx-amount--income" })
        : h(TrendingDown, { size: 16, class: "tx-amount--expense" }),
  },
  {
    key: "title",
    title: t("transactions.table.description"),
    render: (row): string => row.title,
  },
  {
    key: "due_date",
    title: t("transactions.table.date"),
    width: 120,
    render: (row): string => formatTransactionDate(row.due_date),
  },
  {
    key: "amount",
    title: t("transactions.table.amount"),
    width: 140,
    align: "right",
    render: (row): VNode =>
      h(
        "span",
        { class: ["tx-amount", row.type === "income" ? "tx-amount--income" : "tx-amount--expense"] },
        formatCurrency(parseFloat(row.amount)),
      ),
  },
  {
    key: "actions",
    title: t("transactions.table.actions"),
    width: 140,
    align: "right",
    render: (row): VNode =>
      h(
        NButton,
        {
          size: "small",
          type: "primary",
          secondary: true,
          loading: restoreMutation.isPending.value && restoreTarget.value?.id === row.id,
          onClick: (): void => onRestoreClick(row),
        },
        {
          icon: (): VNode => h(RotateCcw, { size: 14 }),
          default: (): string => t("transactions.trash.restore"),
        },
      ),
  },
]);

const restoreConfirmDesc = computed((): string => {
  if (!restoreTarget.value) { return ""; }
  return t("transactions.trash.restoreConfirmDesc", {
    title: restoreTarget.value.title,
    amount: formatCurrency(parseFloat(restoreTarget.value.amount)),
  });
});
</script>

<template>
  <div class="trash-page">
    <div class="trash-page__header">
      <NButton size="small" secondary @click="navigateTo('/transactions')">
        <template #icon><ArrowLeft :size="14" /></template>
        {{ $t('transactions.trash.backToList') }}
      </NButton>
    </div>

    <NModal
      :show="showRestoreConfirm"
      preset="dialog"
      type="success"
      :title="$t('transactions.trash.restoreConfirm')"
      :content="restoreConfirmDesc"
      :positive-text="$t('transactions.trash.restoreConfirmYes')"
      :negative-text="$t('transactions.trash.restoreConfirmNo')"
      :loading="restoreMutation.isPending.value"
      @positive-click="onConfirmRestore"
      @negative-click="onCancelRestore"
      @close="onCancelRestore"
    />

    <UiInlineError
      v-if="isError"
      :title="$t('transactions.trash.loadError')"
      :message="$t('transactions.trash.loadErrorMessage')"
    />
    <UiPageLoader v-else-if="isLoading" :rows="5" />
    <UiEmptyState
      v-else-if="tableData.length === 0"
      icon="transactions"
      :title="$t('transactions.trash.empty.title')"
      :description="$t('transactions.trash.empty.description')"
    />
    <NDataTable
      v-else
      :columns="columns"
      :data="tableData"
      :row-key="(row: TransactionDto) => row.id"
      :scroll-x="720"
      size="small"
      class="trash-page__table"
    />
  </div>
</template>

<style scoped>
.trash-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.trash-page__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.trash-page__table {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  overflow: hidden;
}

:deep(.tx-amount) { font-weight: var(--font-weight-semibold); white-space: nowrap; }
:deep(.tx-amount--income) { color: var(--color-positive); }
:deep(.tx-amount--expense) { color: var(--color-negative); }
</style>
