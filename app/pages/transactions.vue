<script setup lang="ts">
import { computed, h, reactive, ref, watch } from "vue";
import {
  NButton,
  NDataTable,
  NModal,
  NSelect,
  NSpace,
  type DataTableColumns,
  type DataTableRowKey,
  type SelectOption,
} from "naive-ui";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  GripVertical,
  Pencil,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-vue-next";

import { useListTransactionsQuery } from "~/features/transactions/queries/use-list-transactions-query";
import { useDeleteTransactionMutation } from "~/features/transactions/queries/use-delete-transaction-mutation";
import { useMarkTransactionPaidMutation } from "~/features/transactions/queries/use-mark-transaction-paid-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import type {
  TransactionDto,
  TransactionStatusDto,
  TransactionTypeDto,
} from "~/features/transactions/contracts/transaction.dto";
import {
  useRecurrenceDetection,
  type RecurrencePattern,
} from "~/features/transactions/composables/useRecurrenceDetection";
import { formatCurrency } from "~/utils/currency";

// ── Page meta ─────────────────────────────────────────────────────────────────

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Transações",
  pageSubtitle: "Receitas e despesas registradas",
});

useHead({ title: "Transações | Auraxis" });

// ── Filter / sort state ───────────────────────────────────────────────────────

type FilterType = TransactionTypeDto | "all";
type FilterStatus = TransactionStatusDto | "all";

const filterType = ref<FilterType>("all");
const filterStatus = ref<FilterStatus>("all");

// ── Modals ────────────────────────────────────────────────────────────────────

const showIncome = ref(false);
const showExpense = ref(false);

const deleteTarget = ref<TransactionDto | null>(null);
const showDeleteConfirm = ref(false);

const payTarget = ref<TransactionDto | null>(null);
const showPayConfirm = ref(false);

const editTarget = ref<TransactionDto | null>(null);
const showEditModal = ref(false);

// ── Reorder / drag state ──────────────────────────────────────────────────────

const reorderMode = ref(false);
const localOrder = ref<string[]>([]);
const dragSourceId = ref<string | null>(null);
const dragTargetId = ref<string | null>(null);

// ── Swipe state (mobile) ──────────────────────────────────────────────────────

const touchStartX = ref(0);
const swipingRowId = ref<string | null>(null);
const swipeDir = ref<"left" | "right" | null>(null);
const SWIPE_THRESHOLD = 72;

// ── Queries ───────────────────────────────────────────────────────────────────

const { data, isLoading, isError, refetch } = useListTransactionsQuery();
const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();

// ── Mutations ─────────────────────────────────────────────────────────────────

const deleteMutation = useDeleteTransactionMutation();
const markPaidMutation = useMarkTransactionPaidMutation();

// ── Recurrence detection (PROD-13) ───────────────────────────────────────────

const NEVER_KEY = "auraxis:recurrence:never";

/** Keys the user has permanently dismissed. Hydrated from localStorage. */
const neverSuggestKeys = ref<Set<string>>(
  ((): Set<string> => {
    try {
      const raw = localStorage.getItem(NEVER_KEY);
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  })(),
);

/** Keys dismissed only for this session (not persisted). */
const sessionDismissedKeys = ref<Set<string>>(new Set());

const allTransactions = computed(() => data.value ?? []);
const { patterns: detectedPatterns } = useRecurrenceDetection(allTransactions);

/** Patterns still actionable (not dismissed or permanently ignored). */
const visiblePatterns = computed(() =>
  detectedPatterns.value.filter(
    (p) => !neverSuggestKeys.value.has(p.groupKey) && !sessionDismissedKeys.value.has(p.groupKey),
  ),
);

/**
 * Hides a suggestion for this session only.
 *
 * @param groupKey The pattern's group key.
 */
function handleRecurrenceDismiss(groupKey: string): void {
  sessionDismissedKeys.value = new Set([...sessionDismissedKeys.value, groupKey]);
}

/**
 * Permanently hides a suggestion and persists to localStorage.
 *
 * @param groupKey The pattern's group key.
 */
function handleRecurrenceNever(groupKey: string): void {
  const next = new Set([...neverSuggestKeys.value, groupKey]);
  neverSuggestKeys.value = next;
  try {
    localStorage.setItem(NEVER_KEY, JSON.stringify([...next]));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc.)
  }
}

/**
 * Opens the expense quick-add modal pre-tagged with the detected pattern's
 * title, dismissed from the suggestion list for this session.
 *
 * @param pattern The confirmed recurrence pattern.
 */
function handleRecurrenceConfirm(pattern: RecurrencePattern): void {
  sessionDismissedKeys.value = new Set([...sessionDismissedKeys.value, pattern.groupKey]);
  showExpense.value = true;
}

// ── Lookup maps ───────────────────────────────────────────────────────────────

const tagMap = computed(
  () => new Map((tags.value ?? []).map((tg: { id: string; name: string }) => [tg.id, tg.name])),
);

const accountMap = computed(
  () =>
    new Map((accounts.value ?? []).map((ac: { id: string; name: string }) => [ac.id, ac.name])),
);

// ── Select options ────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string (YYYY-MM-DD) as dd/MM/yyyy.
 *
 * @param isoDate ISO 8601 date string.
 * @returns Localised short date.
 */
const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

/**
 * Returns true when the due date is in the past and the transaction is not paid.
 *
 * @param dueDate YYYY-MM-DD string.
 * @param status  Current transaction status.
 * @returns Whether the transaction is overdue.
 */
const isOverdue = (dueDate: string, status: string): boolean => {
  if (status === "paid") { return false; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`) < today;
};

/**
 * Returns true when the due date is within 7 calendar days and not yet paid.
 *
 * @param dueDate YYYY-MM-DD string.
 * @param status  Current transaction status.
 * @returns Whether the transaction is near its due date.
 */
const isNearDue = (dueDate: string, status: string): boolean => {
  if (status === "paid") { return false; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 7;
};

// ── Processed list ────────────────────────────────────────────────────────────

const processedTransactions = computed((): TransactionDto[] => {
  let list = data.value ?? [];

  if (filterType.value !== "all") {
    list = list.filter((tx) => tx.type === filterType.value);
  }

  if (filterStatus.value !== "all") {
    list = list.filter((tx) => tx.status === filterStatus.value);
  }

  return list;
});

/** Table data: respects the local drag-and-drop order when in reorder mode. */
const tableData = computed((): TransactionDto[] => {
  if (!reorderMode.value || localOrder.value.length === 0) {
    return processedTransactions.value;
  }
  const map = new Map(processedTransactions.value.map((tx) => [tx.id, tx]));
  return localOrder.value.flatMap((id) => {
    const tx = map.get(id);
    return tx ? [tx] : [];
  });
});

// Keep localOrder in sync with processedTransactions when filters change.
watch(
  processedTransactions,
  (list) => {
    const newIds = list.map((tx) => tx.id);
    // Reset when ids are entirely different (filter changed) OR when first loaded.
    const currentSet = new Set(localOrder.value);
    const allPresent = newIds.every((id) => currentSet.has(id));
    if (!allPresent || localOrder.value.length === 0) {
      localOrder.value = newIds;
    }
  },
  { immediate: true },
);

// Exit reorder mode when filters change.
watch([filterType, filterStatus], () => {
  reorderMode.value = false;
  localOrder.value = processedTransactions.value.map((tx) => tx.id);
});

// ── Summary ───────────────────────────────────────────────────────────────────

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

// ── Action handlers ───────────────────────────────────────────────────────────

/**
 * Opens the delete confirmation modal for the given row.
 *
 * @param row Transaction to delete.
 */
const handleDeleteClick = (row: TransactionDto): void => {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
};

/** Confirms and executes the pending deletion. */
const confirmDelete = (): void => {
  if (!deleteTarget.value) { return; }
  deleteMutation.mutate(deleteTarget.value.id, {
    onSuccess: () => {
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
    },
  });
};

/**
 * Opens the pay confirmation modal for the given row.
 *
 * Used by both the action button and the swipe-right gesture so the user
 * always gets an explicit confirmation before financial state is changed.
 *
 * @param row Transaction to mark as paid.
 */
const handleMarkPaid = (row: TransactionDto): void => {
  if (row.status === "paid") { return; }
  payTarget.value = row;
  showPayConfirm.value = true;
};

/** Confirms and executes the pending mark-as-paid mutation. */
const confirmMarkPaid = (): void => {
  if (!payTarget.value) { return; }
  markPaidMutation.mutate(payTarget.value.id, {
    onSuccess: () => {
      showPayConfirm.value = false;
      payTarget.value = null;
    },
  });
};

/**
 * Opens the edit modal pre-filled with the given row's data.
 *
 * @param row Transaction to edit.
 */
const handleEdit = (row: TransactionDto): void => {
  editTarget.value = row;
  showEditModal.value = true;
};

/** Called by quick-add modals on successful creation. */
const onTransactionCreated = (): void => {
  void refetch();
};

// ── Drag-and-drop handlers ────────────────────────────────────────────────────

/** Enters visual reorder mode and copies the current order into localOrder. */
const enterReorderMode = (): void => {
  localOrder.value = processedTransactions.value.map((tx) => tx.id);
  reorderMode.value = true;
};

/** Exits reorder mode, keeping the user's custom order for display. */
const exitReorderMode = (): void => {
  reorderMode.value = false;
};

// ── NDataTable ────────────────────────────────────────────────────────────────

/**
 * Renders the status icon cell.
 *
 * Priority: paid → overdue → near-due → pending.
 *
 * @param row Transaction row data.
 * @returns VNode for the status icon.
 */
const statusIconRender = (row: TransactionDto): ReturnType<typeof h> => {
  if (row.status === "paid") {
    return h(CheckCircle2, {
      size: 16,
      class: "tx-status-icon tx-status-icon--paid",
      title: t("transaction.status.paid"),
    });
  }
  if (isOverdue(row.due_date, row.status)) {
    return h(AlertCircle, {
      size: 16,
      class: "tx-status-icon tx-status-icon--overdue",
      title: t("transaction.status.overdue"),
    });
  }
  if (isNearDue(row.due_date, row.status)) {
    return h(AlertTriangle, {
      size: 16,
      class: "tx-status-icon tx-status-icon--near-due",
      title: t("transactions.status.nearDue"),
    });
  }
  return h(Clock, {
    size: 16,
    class: "tx-status-icon tx-status-icon--pending",
    title: t("transaction.status.pending"),
  });
};

/**
 * Renders the coloured amount cell with income/expense prefix.
 *
 * @param row Transaction row data.
 * @returns VNode for the amount cell.
 */
const amountRender = (row: TransactionDto): ReturnType<typeof h> =>
  h(
    "span",
    {
      class: [
        "tx-amount",
        row.type === "income" ? "tx-amount--income" : "tx-amount--expense",
      ],
    },
    [
      row.type === "expense" ? "−" : "+",
      formatCurrency(parseFloat(row.amount)),
    ],
  );

/**
 * Renders the description cell with optional recurring/installment badges.
 *
 * @param row Transaction row data.
 * @returns VNode for the title cell.
 */
const titleRender = (row: TransactionDto): ReturnType<typeof h> =>
  h("div", { class: "tx-title-cell" }, [
    h("span", { class: "tx-title-cell__name" }, row.title),
    row.is_recurring
      ? h("span", { class: "tx-badge" }, [
          h(RefreshCw, { size: 9 }),
          t("transactions.recurring"),
        ])
      : null,
    row.is_installment && row.installment_count
      ? h("span", { class: "tx-badge" }, t("transactions.installment", { count: row.installment_count }))
      : null,
  ]);

/**
 * Renders the actions toolbar (edit, mark-paid, delete).
 *
 * @param row Transaction row data.
 * @returns VNode for the actions cell.
 */
const actionsRender = (row: TransactionDto): ReturnType<typeof h> =>
  h(NSpace, { size: 4, align: "center", wrap: false }, {
    default: () => [
      h(
        NButton,
        {
          size: "tiny",
          quaternary: true,
          circle: true,
          title: t("transactions.action.edit"),
          onClick: () => handleEdit(row),
        },
        { default: () => h(Pencil, { size: 13 }) },
      ),
      h(
        NButton,
        {
          size: "tiny",
          quaternary: true,
          circle: true,
          type: "success",
          disabled: row.status === "paid" || markPaidMutation.isPending.value,
          title: t("transactions.action.markPaid"),
          onClick: () => handleMarkPaid(row),
        },
        { default: () => h(Check, { size: 13 }) },
      ),
      h(
        NButton,
        {
          size: "tiny",
          quaternary: true,
          circle: true,
          type: "error",
          loading: deleteMutation.isPending.value && deleteTarget.value?.id === row.id,
          title: t("transactions.action.delete"),
          onClick: () => handleDeleteClick(row),
        },
        { default: () => h(Trash2, { size: 13 }) },
      ),
    ],
  });

/** Full column definitions. Sorters are disabled while in reorder mode. */
const columns = computed((): DataTableColumns<TransactionDto> => {
  const withSort = !reorderMode.value;

  return [
    // ── Drag handle (reorder mode only) ────────────────────────────────────
    ...(reorderMode.value
      ? [
          {
            key: "__drag" as DataTableRowKey,
            title: "",
            width: 36,
            render: (): ReturnType<typeof h> =>
              h("span", { class: "tx-drag-handle", "aria-hidden": "true" }, [
                h(GripVertical, { size: 14 }),
              ]),
          },
        ]
      : []),

    // ── Status icon ─────────────────────────────────────────────────────────
    {
      key: "status" as DataTableRowKey,
      title: t("transactions.table.status"),
      width: 64,
      render: statusIconRender,
    },

    // ── Date ────────────────────────────────────────────────────────────────
    {
      key: "due_date" as DataTableRowKey,
      title: t("transactions.table.date"),
      width: 108,
      defaultSortOrder: "descend" as const,
      sorter: withSort
        ? (a: TransactionDto, b: TransactionDto): number => a.due_date.localeCompare(b.due_date)
        : undefined,
      render: (row: TransactionDto): string => formatDate(row.due_date),
    },

    // ── Description ─────────────────────────────────────────────────────────
    {
      key: "title" as DataTableRowKey,
      title: t("transactions.table.description"),
      ellipsis: { tooltip: true },
      sorter: withSort
        ? (a: TransactionDto, b: TransactionDto): number => a.title.localeCompare(b.title, "pt-BR")
        : undefined,
      render: titleRender,
    },

    // ── Category ────────────────────────────────────────────────────────────
    {
      key: "tag_id" as DataTableRowKey,
      title: t("transactions.table.category"),
      width: 130,
      ellipsis: { tooltip: true },
      render: (row: TransactionDto): string => tagMap.value.get(row.tag_id ?? "") ?? "—",
    },

    // ── Account ─────────────────────────────────────────────────────────────
    {
      key: "account_id" as DataTableRowKey,
      title: t("transactions.table.account"),
      width: 120,
      ellipsis: { tooltip: true },
      render: (row: TransactionDto): string => accountMap.value.get(row.account_id ?? "") ?? "—",
    },

    // ── Amount ──────────────────────────────────────────────────────────────
    {
      key: "amount" as DataTableRowKey,
      title: t("transactions.table.amount"),
      width: 138,
      sorter: withSort
        ? (a: TransactionDto, b: TransactionDto): number =>
            parseFloat(a.amount) - parseFloat(b.amount)
        : undefined,
      render: amountRender,
    },

    // ── Actions ─────────────────────────────────────────────────────────────
    {
      key: "__actions" as DataTableRowKey,
      title: t("transactions.table.actions"),
      width: 108,
      render: actionsRender,
    },
  ];
});

// ── Row props (drag + swipe) ──────────────────────────────────────────────────

/**
 * Returns HTML attributes applied to each `<tr>` element.
 *
 * Handles:
 * - HTML5 drag-and-drop (reorder mode)
 * - Touch swipe gestures (mobile/PWA): swipe right → mark paid, swipe left → delete
 *
 * @param row Transaction row data.
 * @returns HTML attribute object for the table row element.
 */
const rowProps = (row: TransactionDto): Record<string, unknown> => ({
  class: [
    "tx-table-row",
    dragSourceId.value === row.id ? "tx-table-row--dragging" : "",
    dragTargetId.value === row.id && dragSourceId.value !== row.id
      ? "tx-table-row--drag-over"
      : "",
    swipingRowId.value === row.id && swipeDir.value === "right"
      ? "tx-table-row--swiping-right"
      : "",
    swipingRowId.value === row.id && swipeDir.value === "left"
      ? "tx-table-row--swiping-left"
      : "",
  ]
    .filter(Boolean)
    .join(" "),

  // ── Drag ──────────────────────────────────────────────────────────────────
  draggable: reorderMode.value,

  onDragstart: (e: DragEvent): void => {
    if (!reorderMode.value) { e.preventDefault(); return; }
    dragSourceId.value = row.id;
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; }
  },

  onDragover: (e: DragEvent): void => {
    if (!reorderMode.value) { return; }
    e.preventDefault();
    dragTargetId.value = row.id;
    if (e.dataTransfer) { e.dataTransfer.dropEffect = "move"; }
  },

  onDragleave: (): void => {
    if (dragTargetId.value === row.id) { dragTargetId.value = null; }
  },

  onDrop: (e: DragEvent): void => {
    e.preventDefault();
    if (!dragSourceId.value || dragSourceId.value === row.id) {
      dragSourceId.value = null;
      dragTargetId.value = null;
      return;
    }
    const order = [...localOrder.value];
    const srcIdx = order.indexOf(dragSourceId.value);
    const tgtIdx = order.indexOf(row.id);
    if (srcIdx !== -1 && tgtIdx !== -1) {
      const [item] = order.splice(srcIdx, 1);
      order.splice(tgtIdx, 0, item!);
      localOrder.value = order;
    }
    dragSourceId.value = null;
    dragTargetId.value = null;
  },

  onDragend: (): void => {
    dragSourceId.value = null;
    dragTargetId.value = null;
  },

  // ── Touch swipe ───────────────────────────────────────────────────────────
  onTouchstart: (e: TouchEvent): void => {
    touchStartX.value = e.touches[0]?.clientX ?? 0;
    swipingRowId.value = row.id;
    swipeDir.value = null;
  },

  onTouchmove: (e: TouchEvent): void => {
    if (swipingRowId.value !== row.id) { return; }
    const delta = (e.touches[0]?.clientX ?? 0) - touchStartX.value;
    if (Math.abs(delta) > 20) {
      swipeDir.value = delta > 0 ? "right" : "left";
    }
  },

  onTouchend: (e: TouchEvent): void => {
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.value;
    swipingRowId.value = null;
    swipeDir.value = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) { return; }

    if (delta > 0) {
      // Swipe right → mark as paid
      handleMarkPaid(row);
    } else {
      // Swipe left → delete
      handleDeleteClick(row);
    }
  },
});

// ── Pagination ────────────────────────────────────────────────────────────────

const pagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }: { itemCount: number | undefined }): string =>
    t("transactions.count", { n: itemCount ?? 0 }),
  onChange: (page: number): void => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number): void => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  },
});

// Reset to first page when filters change.
watch([filterType, filterStatus], () => {
  pagination.page = 1;
});

/**
 * Row key accessor for NDataTable.
 *
 * @param row Transaction row data.
 * @returns Unique row identifier.
 */
const rowKey = (row: TransactionDto): string => row.id;
</script>

<template>
  <div class="transactions-page">

    <!-- ── Quick-add modals ──────────────────────────────────────────────────── -->
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

    <!-- ── Edit modal ───────────────────────────────────────────────────────── -->
    <EditTransactionModal
      :visible="showEditModal"
      :transaction="editTarget"
      @update:visible="showEditModal = $event"
      @success="onTransactionCreated"
    />

    <!-- ── Delete confirmation ───────────────────────────────────────────────── -->
    <NModal
      :show="showDeleteConfirm"
      preset="dialog"
      type="error"
      :title="$t('transactions.action.delete')"
      :content="$t('transactions.action.deleteConfirm')"
      :positive-text="$t('transactions.action.deleteConfirmYes')"
      :negative-text="$t('transactions.action.deleteConfirmNo')"
      :loading="deleteMutation.isPending.value"
      @positive-click="confirmDelete"
      @negative-click="showDeleteConfirm = false"
      @close="showDeleteConfirm = false"
    />

    <!-- ── Pay confirmation ──────────────────────────────────────────────────── -->
    <NModal
      :show="showPayConfirm"
      preset="dialog"
      type="success"
      :title="$t('transactions.action.markPaidConfirm')"
      :content="payTarget ? $t('transactions.action.markPaidConfirmDesc', { title: payTarget.title, amount: formatCurrency(parseFloat(payTarget.amount)) }) : ''"
      :positive-text="$t('transactions.action.markPaidConfirmYes')"
      :negative-text="$t('transactions.action.markPaidConfirmNo')"
      :loading="markPaidMutation.isPending.value"
      @positive-click="confirmMarkPaid"
      @negative-click="showPayConfirm = false"
      @close="showPayConfirm = false"
    />

    <!-- ── Recurrence suggestions (PROD-13) ──────────────────────────────────── -->
    <div
      v-if="visiblePatterns.length > 0"
      class="transactions-page__recurrence"
      aria-label="Sugestões de recorrência"
    >
      <RecurrenceSuggestionCard
        v-for="pattern in visiblePatterns"
        :key="pattern.groupKey"
        :pattern="pattern"
        @confirm="handleRecurrenceConfirm"
        @dismiss="handleRecurrenceDismiss"
        @never="handleRecurrenceNever"
      />
    </div>

    <!-- ── Summary strip ─────────────────────────────────────────────────────── -->
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

    <!-- ── Toolbar ───────────────────────────────────────────────────────────── -->
    <div class="transactions-page__toolbar">
      <!-- Filters -->
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
        style="min-width: 150px"
      />

      <!-- Spacer -->
      <div class="transactions-page__toolbar-spacer" />

      <!-- Reorder toggle -->
      <NButton
        size="small"
        :type="reorderMode ? 'primary' : 'default'"
        @click="reorderMode ? exitReorderMode() : enterReorderMode()"
      >
        <template #icon><GripVertical :size="14" /></template>
        {{ reorderMode ? $t('transactions.reorder.exit') : $t('transactions.reorder.enter') }}
      </NButton>

      <!-- Add buttons -->
      <NButton size="small" @click="showIncome = true">
        <template #icon><TrendingUp :size="14" /></template>
        {{ $t('transactions.addIncome') }}
      </NButton>
      <NButton type="primary" size="small" @click="showExpense = true">
        <template #icon><TrendingDown :size="14" /></template>
        {{ $t('transactions.addExpense') }}
      </NButton>
    </div>

    <!-- ── Reorder hint ──────────────────────────────────────────────────────── -->
    <p v-if="reorderMode" class="transactions-page__reorder-hint">
      <GripVertical :size="12" />
      {{ $t('transactions.reorder.hint') }}
    </p>

    <!-- ── Swipe hint (mobile only) ─────────────────────────────────────────── -->
    <p v-if="!reorderMode" class="transactions-page__swipe-hint">
      {{ $t('transactions.swipe.payHint') }} &nbsp;·&nbsp; {{ $t('transactions.swipe.deleteHint') }}
    </p>

    <!-- ── Error ─────────────────────────────────────────────────────────────── -->
    <UiInlineError
      v-if="isError"
      :title="$t('transactions.loadError')"
      :message="$t('transactions.loadErrorMessage')"
    />

    <!-- ── Loading ───────────────────────────────────────────────────────────── -->
    <UiPageLoader v-else-if="isLoading" :rows="5" />

    <!-- ── Empty ─────────────────────────────────────────────────────────────── -->
    <UiEmptyState
      v-else-if="tableData.length === 0"
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

    <!-- ── Data table ────────────────────────────────────────────────────────── -->
    <NDataTable
      v-else
      :columns="columns"
      :data="tableData"
      :loading="isLoading"
      :pagination="pagination"
      :row-key="rowKey"
      :row-props="rowProps"
      :scroll-x="780"
      size="small"
      class="transactions-page__table"
    />

  </div>
</template>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

/* ── Recurrence suggestions ─────────────────────────────────────────────────── */
.transactions-page__recurrence {
  display: grid;
  gap: var(--space-2);
}

/* ── Summary strip ──────────────────────────────────────────────────────────── */
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

.summary-card--income .summary-card__icon { color: var(--color-positive); }
.summary-card--expense .summary-card__icon { color: var(--color-negative); }

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

/* ── Toolbar ────────────────────────────────────────────────────────────────── */
.transactions-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.transactions-page__toolbar-spacer {
  flex: 1;
}

/* ── Hints ──────────────────────────────────────────────────────────────────── */
.transactions-page__reorder-hint,
.transactions-page__swipe-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Swipe hint only visible on touch devices */
.transactions-page__swipe-hint {
  display: none;
}

@media (pointer: coarse) {
  .transactions-page__swipe-hint {
    display: flex;
  }
}

/* ── Table ──────────────────────────────────────────────────────────────────── */
.transactions-page__table {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  overflow: hidden;
}

/* Global styles applied via :deep() since NDataTable renders <tr> elements */
.transactions-page__table :deep(.tx-table-row) {
  cursor: default;
  transition:
    background-color 0.15s ease,
    transform 0.12s ease;
}

.transactions-page__table :deep(.tx-table-row:hover) {
  background-color: var(--color-bg-elevated) !important;
}

.transactions-page__table :deep(.tx-table-row--dragging) {
  opacity: 0.45;
  cursor: grabbing;
}

.transactions-page__table :deep(.tx-table-row--drag-over) {
  background-color: color-mix(in srgb, var(--color-brand-500) 8%, transparent) !important;
  border-top: 2px solid var(--color-brand-500);
}

/* Mobile swipe visual feedback */
.transactions-page__table :deep(.tx-table-row--swiping-right) {
  background-color: color-mix(in srgb, var(--color-positive) 10%, transparent) !important;
}

.transactions-page__table :deep(.tx-table-row--swiping-left) {
  background-color: color-mix(in srgb, var(--color-negative) 10%, transparent) !important;
}

/* ── Row-level component styles ─────────────────────────────────────────────── */
:deep(.tx-status-icon) { display: block; }
:deep(.tx-status-icon--paid)     { color: var(--color-positive); }
:deep(.tx-status-icon--overdue)  { color: var(--color-negative); }
:deep(.tx-status-icon--near-due) { color: var(--color-warning, #f0a020); }
:deep(.tx-status-icon--pending)  { color: var(--color-text-muted); }

:deep(.tx-amount) {
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}
:deep(.tx-amount--income)  { color: var(--color-positive); }
:deep(.tx-amount--expense) { color: var(--color-negative); }

:deep(.tx-title-cell) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
:deep(.tx-title-cell__name) {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

:deep(.tx-badge) {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

:deep(.tx-drag-handle) {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: var(--color-text-muted);
}

:deep(.tx-drag-handle:active) {
  cursor: grabbing;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .transactions-page__summary {
    grid-template-columns: 1fr;
  }

  .transactions-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .transactions-page__toolbar-spacer {
    display: none;
  }
}
</style>
