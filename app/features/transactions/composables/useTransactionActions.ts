import { ref, type Ref } from "vue";
import { useDeleteTransactionMutation } from "~/features/transactions/queries/use-delete-transaction-mutation";
import { useMarkTransactionPaidMutation } from "~/features/transactions/queries/use-mark-transaction-paid-mutation";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

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
  handleDeleteClick: (row: TransactionDto) => void;
  confirmDelete: () => void;
  handleMarkPaid: (row: TransactionDto) => void;
  confirmMarkPaid: () => void;
  handleEdit: (row: TransactionDto) => void;
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
  const showIncome = ref(false);
  const showExpense = ref(false);

  const deleteTarget = ref<TransactionDto | null>(null);
  const showDeleteConfirm = ref(false);

  const payTarget = ref<TransactionDto | null>(null);
  const showPayConfirm = ref(false);

  const editTarget = ref<TransactionDto | null>(null);
  const showEditModal = ref(false);

  const deleteMutation = useDeleteTransactionMutation();
  const markPaidMutation = useMarkTransactionPaidMutation();

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
    handleDeleteClick,
    confirmDelete,
    handleMarkPaid,
    confirmMarkPaid,
    handleEdit,
    onTransactionCreated,
  };
}
