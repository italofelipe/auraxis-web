import { computed, h, reactive, ref, watch, type ComputedRef, type Ref } from "vue";
import {
  NButton,
  NSpace,
  type DataTableColumns,
  type DataTableRowKey,
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
} from "lucide-vue-next";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import type { TagLookup } from "./useTransactionFilters";
import { formatCurrency } from "~/utils/currency";

const SWIPE_THRESHOLD = 72;

/**
 * Formats an ISO date string (YYYY-MM-DD) as dd/MM/yyyy (pt-BR locale).
 *
 * @param isoDate ISO 8601 date string.
 * @returns Localised short date.
 */
export function formatTransactionDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${isoDate}T00:00:00`));
}

/**
 * Returns true when the due date is in the past and the transaction is not paid.
 *
 * @param dueDate YYYY-MM-DD string.
 * @param status  Current transaction status.
 * @returns Whether the transaction is overdue.
 */
export function isTransactionOverdue(dueDate: string, status: string): boolean {
  if (status === "paid") { return false; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`) < today;
}

/**
 * Returns true when the due date is within 7 calendar days and not yet paid.
 *
 * @param dueDate YYYY-MM-DD string.
 * @param status  Current transaction status.
 * @returns Whether the transaction is near its due date.
 */
export function isTransactionNearDue(dueDate: string, status: string): boolean {
  if (status === "paid") { return false; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 7;
}

export type UseTransactionTableOptions = {
  data: Ref<TransactionDto[] | undefined> | ComputedRef<TransactionDto[] | undefined>;
  tagMap: ComputedRef<Map<string, string>>;
  tagDetailMap: ComputedRef<Map<string, TagLookup>>;
  accountMap: ComputedRef<Map<string, string>>;
  filterType: Ref<string>;
  filterStatus: Ref<string>;
  filterStartDate: Ref<number | null>;
  filterEndDate: Ref<number | null>;
  filterTagId: Ref<string>;
  deleteMutation: { isPending: Ref<boolean> };
  markPaidMutation: { isPending: Ref<boolean> };
  deleteTarget: Ref<TransactionDto | null>;
  onEdit: (row: TransactionDto) => void;
  onMarkPaid: (row: TransactionDto) => void;
  onDelete: (row: TransactionDto) => void;
};

export type UseTransactionTableReturn = {
  reorderMode: Ref<boolean>;
  tableData: ComputedRef<TransactionDto[]>;
  totalIncome: ComputedRef<number>;
  totalExpense: ComputedRef<number>;
  columns: ComputedRef<DataTableColumns<TransactionDto>>;
  rowProps: (row: TransactionDto) => Record<string, unknown>;
  rowKey: (row: TransactionDto) => string;
  pagination: {
    page: number;
    pageSize: number;
    showSizePicker: boolean;
    pageSizes: number[];
    prefix: (ctx: { itemCount: number | undefined }) => string;
    onChange: (page: number) => void;
    onUpdatePageSize: (pageSize: number) => void;
  };
  enterReorderMode: () => void;
  exitReorderMode: () => void;
};

type DragState = {
  reorderMode: Ref<boolean>;
  localOrder: Ref<string[]>;
  dragSourceId: Ref<string | null>;
  dragTargetId: Ref<string | null>;
  touchStartX: Ref<number>;
  swipingRowId: Ref<string | null>;
  swipeDir: Ref<"left" | "right" | null>;
};

/**
 * Creates reactive drag-and-drop and touch-swipe state for the table.
 *
 * @returns Initial drag and swipe state refs.
 */
function createDragState(): DragState {
  return {
    reorderMode: ref(false),
    localOrder: ref<string[]>([]),
    dragSourceId: ref<string | null>(null),
    dragTargetId: ref<string | null>(null),
    touchStartX: ref(0),
    swipingRowId: ref<string | null>(null),
    swipeDir: ref<"left" | "right" | null>(null),
  };
}

/**
 * Builds the row props object for drag-and-drop and touch-swipe interaction.
 *
 * Handles HTML5 drag events (reorder mode) and touch swipe gestures
 * (swipe right → mark paid, swipe left → delete).
 *
 * @param row   Transaction row data.
 * @param drag  Drag/swipe state refs.
 * @param opts  Action callbacks from the actions composable.
 * @returns HTML attribute object for the NDataTable row element.
 */
function buildRowProps(row: TransactionDto, drag: DragState, opts: Pick<UseTransactionTableOptions, "onMarkPaid" | "onDelete">): Record<string, unknown> {
  const { reorderMode, localOrder, dragSourceId, dragTargetId, touchStartX, swipingRowId, swipeDir } = drag;
  return {
    class: ["tx-table-row", dragSourceId.value === row.id ? "tx-table-row--dragging" : "", dragTargetId.value === row.id && dragSourceId.value !== row.id ? "tx-table-row--drag-over" : "", swipingRowId.value === row.id && swipeDir.value === "right" ? "tx-table-row--swiping-right" : "", swipingRowId.value === row.id && swipeDir.value === "left" ? "tx-table-row--swiping-left" : ""].filter(Boolean).join(" "),
    draggable: reorderMode.value,
    onDragstart: (e: DragEvent): void => { if (!reorderMode.value) { e.preventDefault(); return; } dragSourceId.value = row.id; if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; } },
    onDragover: (e: DragEvent): void => { if (!reorderMode.value) { return; } e.preventDefault(); dragTargetId.value = row.id; if (e.dataTransfer) { e.dataTransfer.dropEffect = "move"; } },
    onDragleave: (): void => { if (dragTargetId.value === row.id) { dragTargetId.value = null; } },
    onDrop: (e: DragEvent): void => {
      e.preventDefault();
      if (!dragSourceId.value || dragSourceId.value === row.id) { dragSourceId.value = null; dragTargetId.value = null; return; }
      const order = [...localOrder.value];
      const srcIdx = order.indexOf(dragSourceId.value);
      const tgtIdx = order.indexOf(row.id);
      if (srcIdx !== -1 && tgtIdx !== -1) { const [item] = order.splice(srcIdx, 1); order.splice(tgtIdx, 0, item!); localOrder.value = order; }
      dragSourceId.value = null;
      dragTargetId.value = null;
    },
    onDragend: (): void => { dragSourceId.value = null; dragTargetId.value = null; },
    onTouchstart: (e: TouchEvent): void => { touchStartX.value = e.touches[0]?.clientX ?? 0; swipingRowId.value = row.id; swipeDir.value = null; },
    onTouchmove: (e: TouchEvent): void => { if (swipingRowId.value !== row.id) { return; } const delta = (e.touches[0]?.clientX ?? 0) - touchStartX.value; if (Math.abs(delta) > 20) { swipeDir.value = delta > 0 ? "right" : "left"; } },
    onTouchend: (e: TouchEvent): void => {
      const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.value;
      swipingRowId.value = null;
      swipeDir.value = null;
      if (Math.abs(delta) >= SWIPE_THRESHOLD) { if (delta > 0) { opts.onMarkPaid(row); } else { opts.onDelete(row); } }
    },
  };
}

/**
 * Renders the status icon cell with priority: paid → overdue → near-due → pending.
 *
 * @param row Transaction row data.
 * @param t   i18n translation function.
 * @returns VNode for the status icon.
 */
function renderStatusIcon(row: TransactionDto, t: (key: string) => string): ReturnType<typeof h> {
  if (row.status === "paid") { return h(CheckCircle2, { size: 16, class: "tx-status-icon tx-status-icon--paid", title: t("transaction.status.paid") }); }
  if (isTransactionOverdue(row.due_date, row.status)) { return h(AlertCircle, { size: 16, class: "tx-status-icon tx-status-icon--overdue", title: t("transaction.status.overdue") }); }
  if (isTransactionNearDue(row.due_date, row.status)) { return h(AlertTriangle, { size: 16, class: "tx-status-icon tx-status-icon--near-due", title: t("transactions.status.nearDue") }); }
  return h(Clock, { size: 16, class: "tx-status-icon tx-status-icon--pending", title: t("transaction.status.pending") });
}

/**
 * Renders the coloured amount cell with income/expense prefix.
 *
 * @param row Transaction row data.
 * @returns VNode for the amount cell.
 */
function renderAmount(row: TransactionDto): ReturnType<typeof h> {
  return h("span", { class: ["tx-amount", row.type === "income" ? "tx-amount--income" : "tx-amount--expense"] }, [row.type === "expense" ? "−" : "+", formatCurrency(parseFloat(row.amount))]);
}

/**
 * Renders the description cell with optional recurring/installment badges.
 *
 * @param row Transaction row data.
 * @param t   i18n translation function.
 * @returns VNode for the title cell.
 */
function renderTitle(row: TransactionDto, t: (key: string, ctx?: Record<string, unknown>) => string): ReturnType<typeof h> {
  return h("div", { class: "tx-title-cell" }, [
    h("span", { class: "tx-title-cell__name" }, row.title),
    row.is_recurring ? h("span", { class: "tx-badge" }, [h(RefreshCw, { size: 9 }), t("transactions.recurring")]) : null,
    row.is_installment && row.installment_count ? h("span", { class: "tx-badge" }, t("transactions.installment", { count: row.installment_count })) : null,
  ]);
}

/**
 * Renders the actions toolbar (edit, mark-paid, delete).
 *
 * @param row  Transaction row data.
 * @param opts Table options containing mutation state and callbacks.
 * @param t    i18n translation function.
 * @returns VNode for the actions cell.
 */
function renderActions(
  row: TransactionDto,
  opts: Pick<UseTransactionTableOptions, "deleteMutation" | "markPaidMutation" | "deleteTarget" | "onEdit" | "onMarkPaid" | "onDelete">,
  t: (key: string) => string,
): ReturnType<typeof h> {
  return h(NSpace, { size: 4, align: "center", wrap: false }, {
    default: () => [
      h(NButton, { size: "tiny", quaternary: true, circle: true, title: t("transactions.action.edit"), onClick: () => opts.onEdit(row) }, { default: () => h(Pencil, { size: 13 }) }),
      h(NButton, { size: "tiny", quaternary: true, circle: true, type: "success", disabled: row.status === "paid" || opts.markPaidMutation.isPending.value, title: t("transactions.action.markPaid"), onClick: () => opts.onMarkPaid(row) }, { default: () => h(Check, { size: 13 }) }),
      h(NButton, { size: "tiny", quaternary: true, circle: true, type: "error", loading: opts.deleteMutation.isPending.value && opts.deleteTarget.value?.id === row.id, title: t("transactions.action.delete"), onClick: () => opts.onDelete(row) }, { default: () => h(Trash2, { size: 13 }) }),
    ],
  });
}

/**
 * Darkens a hex colour by mixing it with black.
 *
 * @param hex    7-char hex string like "#FF6B6B".
 * @param factor 0-1 where 0 = original, 1 = fully black.
 * @returns Darkened hex string.
 */
function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  /**
   * @param v - Channel value (0-255).
   * @returns Hex pair string.
   */
  const d = (v: number): string => Math.round(v * (1 - factor)).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

/**
 * Renders the tag column as a coloured badge when the tag has a colour,
 * or as plain text when it does not.
 *
 * @param row          Transaction row.
 * @param tagDetailMap Reactive map of tag id → {name, color}.
 * @returns VNode or plain string.
 */
function renderTagBadge(
  row: TransactionDto,
  tagDetailMap: ComputedRef<Map<string, TagLookup>>,
): ReturnType<typeof h> | string {
  const tag = tagDetailMap.value.get(row.tag_id ?? "");
  if (!tag) { return "—"; }
  if (!tag.color) { return tag.name; }
  return h("span", {
    class: "tx-tag-badge",
    style: {
      backgroundColor: `${tag.color}20`,
      border: `1px solid ${darkenHex(tag.color, 0.25)}`,
      color: darkenHex(tag.color, 0.4),
    },
  }, tag.name);
}

/**
 * Manages table columns, drag-and-drop reorder, touch swipe gestures,
 * row props, pagination and summary totals for the transactions page.
 *
 * @param opts - Action callbacks and reactive data from sibling composables.
 * @returns Table state, column definitions, row interaction handlers and pagination.
 */
export function useTransactionTable(opts: UseTransactionTableOptions): UseTransactionTableReturn {
  const { t } = useI18n();
  const filterSources = [opts.filterType, opts.filterStatus, opts.filterStartDate, opts.filterEndDate, opts.filterTagId] as const;
  const drag = createDragState();

  const processedTransactions = computed((): TransactionDto[] => opts.data.value ?? []);
  const tableData = computed((): TransactionDto[] => {
    if (!drag.reorderMode.value || drag.localOrder.value.length === 0) { return processedTransactions.value; }
    const map = new Map(processedTransactions.value.map((tx) => [tx.id, tx]));
    return drag.localOrder.value.flatMap((id) => { const tx = map.get(id); return tx ? [tx] : []; });
  });

  watch(processedTransactions, (list) => {
    const newIds = list.map((tx) => tx.id);
    if (!newIds.every((id) => new Set(drag.localOrder.value).has(id)) || drag.localOrder.value.length === 0) {
      drag.localOrder.value = newIds;
    }
  }, { immediate: true });

  const pagination = reactive({
    page: 1, pageSize: 20, showSizePicker: true, pageSizes: [10, 20, 50],
    prefix: ({ itemCount }: { itemCount: number | undefined }): string => t("transactions.count", { n: itemCount ?? 0 }),
    onChange: (page: number): void => { pagination.page = page; },
    onUpdatePageSize: (pageSize: number): void => { pagination.pageSize = pageSize; pagination.page = 1; },
  });

  watch(filterSources, () => {
    drag.reorderMode.value = false;
    drag.localOrder.value = processedTransactions.value.map((tx) => tx.id);
    pagination.page = 1;
  });

  const totalIncome = computed(() => (opts.data.value ?? []).filter((tx) => tx.type === "income").reduce((sum, tx) => sum + parseFloat(tx.amount), 0));
  const totalExpense = computed(() => (opts.data.value ?? []).filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + parseFloat(tx.amount), 0));

  /**
   * Enters visual reorder mode and copies the current order into localOrder.
   */
  function enterReorderMode(): void { drag.localOrder.value = processedTransactions.value.map((tx) => tx.id); drag.reorderMode.value = true; }

  /**
   * Exits reorder mode, keeping the user's custom order for display.
   */
  function exitReorderMode(): void { drag.reorderMode.value = false; }

  const columns = computed((): DataTableColumns<TransactionDto> => {
    const withSort = !drag.reorderMode.value;
    return [
      ...(drag.reorderMode.value ? [{ key: "__drag" as DataTableRowKey, title: "", width: 36, render: (): ReturnType<typeof h> => h("span", { class: "tx-drag-handle", "aria-hidden": "true" }, [h(GripVertical, { size: 14 })]) }] : []),
      { key: "status" as DataTableRowKey, title: t("transactions.table.status"), width: 64, render: (row: TransactionDto) => renderStatusIcon(row, t) },
      { key: "due_date" as DataTableRowKey, title: t("transactions.table.date"), width: 108, defaultSortOrder: "descend" as const, sorter: withSort ? (a: TransactionDto, b: TransactionDto): number => a.due_date.localeCompare(b.due_date) : undefined, render: (row: TransactionDto): string => formatTransactionDate(row.due_date) },
      { key: "title" as DataTableRowKey, title: t("transactions.table.description"), ellipsis: { tooltip: true }, sorter: withSort ? (a: TransactionDto, b: TransactionDto): number => a.title.localeCompare(b.title, "pt-BR") : undefined, render: (row: TransactionDto) => renderTitle(row, t) },
      { key: "tag_id" as DataTableRowKey, title: t("transactions.table.category"), width: 150, ellipsis: { tooltip: true }, render: (row: TransactionDto) => renderTagBadge(row, opts.tagDetailMap) },
      { key: "account_id" as DataTableRowKey, title: t("transactions.table.account"), width: 120, ellipsis: { tooltip: true }, render: (row: TransactionDto): string => opts.accountMap.value.get(row.account_id ?? "") ?? "—" },
      { key: "amount" as DataTableRowKey, title: t("transactions.table.amount"), width: 138, sorter: withSort ? (a: TransactionDto, b: TransactionDto): number => parseFloat(a.amount) - parseFloat(b.amount) : undefined, render: (row: TransactionDto) => renderAmount(row) },
      { key: "__actions" as DataTableRowKey, title: t("transactions.table.actions"), width: 108, render: (row: TransactionDto) => renderActions(row, opts, t) },
    ];
  });

  /**
   * Row key accessor for NDataTable.
   *
   * @param row Transaction row data.
   * @returns Unique row identifier.
   */
  function rowKey(row: TransactionDto): string { return row.id; }

  return {
    reorderMode: drag.reorderMode, tableData, totalIncome, totalExpense,
    columns, rowProps: (row) => buildRowProps(row, drag, opts), rowKey, pagination,
    enterReorderMode, exitReorderMode,
  };
}
