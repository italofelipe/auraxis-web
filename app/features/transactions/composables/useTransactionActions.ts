import { ref, type Ref } from "vue";
import { useDeleteTransactionMutation } from "~/features/transactions/queries/use-delete-transaction-mutation";
import { useMarkTransactionPaidMutation } from "~/features/transactions/queries/use-mark-transaction-paid-mutation";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import type {
  CreateTransactionPayload,
  TransactionDto,
} from "~/features/transactions/contracts/transaction.dto";

/**
 * Builds a CreateTransactionPayload that clones the given transaction's
 * core fields, suffixes the title with "(cópia)" and resets the status to
 * pending. Recurrence and installment flags are intentionally dropped so
 * the duplicate is a standalone single entry.
 *
 * @param row - Source transaction to duplicate.
 * @returns Payload ready for {@link useCreateTransactionMutation}.
 */
export function buildDuplicatePayload(row: TransactionDto): CreateTransactionPayload {
  return {
    title: `${row.title} (cópia)`,
    amount: row.amount,
    type: row.type,
    due_date: row.due_date,
    status: "pending",
    tag_id: row.tag_id,
    account_id: row.account_id,
    credit_card_id: row.credit_card_id,
    ...(row.description ? { description: row.description } : {}),
    ...(row.currency ? { currency: row.currency } : {}),
  };
}

export type UseTransactionActionsReturn = {
  showIncome: Ref<boolean>;
  showExpense: Ref<boolean>;
  deleteTarget: Ref<TransactionDto | null>;
  showDeleteConfirm: Ref<boolean>;
  payTarget: Ref<TransactionDto | null>;
  showPayConfirm: Ref<boolean>;
  editTarget: Ref<TransactionDto | null>;
  showEditModal: Ref<boolean>;
  deleteMutation: ReturnType<typeof useDeleteTransactionMutation>;
  markPaidMutation: ReturnType<typeof useMarkTransactionPaidMutation>;
  duplicateMutation: ReturnType<typeof useCreateTransactionMutation>;
  handleDeleteClick: (row: TransactionDto) => void;
  confirmDelete: () => void;
  handleMarkPaid: (row: TransactionDto) => void;
  confirmMarkPaid: () => void;
  handleEdit: (row: TransactionDto) => void;
  handleDuplicate: (row: TransactionDto) => void;
  onTransactionCreated: () => void;
};

/**
 * Manages modal visibility, mutations and action handlers for the
 * transactions page.
 *
 * Centralises all create/edit/delete/pay flows so the page template
 * only needs to bind the returned refs and call the returned handlers.
 *
 * @param onRefetch - Callback invoked after a successful mutation to
 *                    refresh the transactions list.
 * @returns Modal state refs, mutations and action handlers.
 */
export function useTransactionActions(onRefetch: () => void): UseTransactionActionsReturn {
  const showIncome = ref(false), showExpense = ref(false), showDeleteConfirm = ref(false);
  const showPayConfirm = ref(false), showEditModal = ref(false);

  const deleteTarget = ref<TransactionDto | null>(null);
  const payTarget = ref<TransactionDto | null>(null);
  const editTarget = ref<TransactionDto | null>(null);

  const deleteMutation = useDeleteTransactionMutation();
  const markPaidMutation = useMarkTransactionPaidMutation();
  const duplicateMutation = useCreateTransactionMutation();

  /**
   * Opens the delete confirmation modal for the given row.
   *
   * @param row Transaction to delete.
   */
  function handleDeleteClick(row: TransactionDto): void {
    deleteTarget.value = row;
    showDeleteConfirm.value = true;
  }

  /**
   * Confirms and executes the pending deletion.
   */
  function confirmDelete(): void {
    if (!deleteTarget.value) { return; }
    deleteMutation.mutate(deleteTarget.value.id, {
      onSuccess: () => {
        showDeleteConfirm.value = false;
        deleteTarget.value = null;
        onRefetch();
      },
    });
  }

  /**
   * Opens the pay confirmation modal for the given row.
   *
   * Used by both the action button and the swipe-right gesture.
   *
   * @param row Transaction to mark as paid.
   */
  function handleMarkPaid(row: TransactionDto): void {
    if (row.status === "paid") { return; }
    payTarget.value = row;
    showPayConfirm.value = true;
  }

  /**
   * Confirms and executes the pending mark-as-paid mutation.
   */
  function confirmMarkPaid(): void {
    if (!payTarget.value) { return; }
    markPaidMutation.mutate(payTarget.value.id, {
      onSuccess: () => {
        showPayConfirm.value = false;
        payTarget.value = null;
      },
    });
  }

  /**
   * Opens the edit modal pre-filled with the given row's data.
   *
   * @param row Transaction to edit.
   */
  function handleEdit(row: TransactionDto): void {
    editTarget.value = row;
    showEditModal.value = true;
  }

  /**
   * Called by quick-add modals on successful creation.
   */
  function onTransactionCreated(): void {
    onRefetch();
  }

  /**
   * Duplicates a transaction by creating a new one with the same core fields.
   * Delegates payload shaping to {@link buildDuplicatePayload}.
   *
   * @param row - Transaction to duplicate.
   */
  function handleDuplicate(row: TransactionDto): void {
    duplicateMutation.mutate(buildDuplicatePayload(row), { onSuccess: () => onRefetch() });
  }

  return {
    showIncome,
    showExpense,
    deleteTarget,
    showDeleteConfirm,
    payTarget,
    showPayConfirm,
    editTarget,
    showEditModal,
    deleteMutation,
    markPaidMutation,
    duplicateMutation,
    handleDeleteClick,
    confirmDelete,
    handleMarkPaid,
    confirmMarkPaid,
    handleEdit,
    handleDuplicate,
    onTransactionCreated,
  };
}
