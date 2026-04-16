import { describe, expect, it, vi } from "vitest";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { useTransactionActions } from "../useTransactionActions";

const mockDeleteMutate = vi.fn();
const mockMarkPaidMutate = vi.fn();
const mockCreateMutate = vi.fn();

vi.mock("~/features/transactions/queries/use-delete-transaction-mutation", () => ({
  useDeleteTransactionMutation: (): { mutate: ReturnType<typeof vi.fn>; isPending: { value: boolean } } => ({
    mutate: mockDeleteMutate,
    isPending: { value: false },
  }),
}));

vi.mock("~/features/transactions/queries/use-mark-transaction-paid-mutation", () => ({
  useMarkTransactionPaidMutation: (): { mutate: ReturnType<typeof vi.fn>; isPending: { value: boolean } } => ({
    mutate: mockMarkPaidMutate,
    isPending: { value: false },
  }),
}));

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): { mutate: ReturnType<typeof vi.fn>; isPending: { value: boolean } } => ({
    mutate: mockCreateMutate,
    isPending: { value: false },
  }),
}));

/**
 * Creates a minimal TransactionDto with sensible defaults for testing.
 *
 * @param overrides - Partial fields to override on the default object.
 * @returns A complete TransactionDto stub.
 */
function makeTransaction(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx-1",
    title: "Test",
    amount: "100.00",
    type: "expense",
    status: "pending",
    due_date: "2026-01-01",
    is_recurring: false,
    is_installment: false,
    installment_count: null,
    tag_id: null,
    account_id: null,
    ...overrides,
  } as TransactionDto;
}

describe("useTransactionActions", () => {
  it("handleDeleteClick opens delete confirm modal with the target", () => {
    const { showDeleteConfirm, deleteTarget, handleDeleteClick } = useTransactionActions(vi.fn());
    const tx = makeTransaction();
    handleDeleteClick(tx);
    expect(showDeleteConfirm.value).toBe(true);
    expect(deleteTarget.value).toStrictEqual(tx);
  });

  it("handleMarkPaid does nothing if transaction is already paid", () => {
    const { showPayConfirm, handleMarkPaid } = useTransactionActions(vi.fn());
    const tx = makeTransaction({ status: "paid" });
    handleMarkPaid(tx);
    expect(showPayConfirm.value).toBe(false);
  });

  it("handleMarkPaid opens pay confirm modal for unpaid transaction", () => {
    const { showPayConfirm, payTarget, handleMarkPaid } = useTransactionActions(vi.fn());
    const tx = makeTransaction();
    handleMarkPaid(tx);
    expect(showPayConfirm.value).toBe(true);
    expect(payTarget.value).toStrictEqual(tx);
  });

  it("handleEdit opens edit modal with the target transaction", () => {
    const { showEditModal, editTarget, handleEdit } = useTransactionActions(vi.fn());
    const tx = makeTransaction();
    handleEdit(tx);
    expect(showEditModal.value).toBe(true);
    expect(editTarget.value).toStrictEqual(tx);
  });

  it("onTransactionCreated calls onRefetch callback", () => {
    const refetch = vi.fn();
    const { onTransactionCreated } = useTransactionActions(refetch);
    onTransactionCreated();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("confirmDelete calls deleteMutation.mutate with the target id", () => {
    const { showDeleteConfirm, handleDeleteClick, confirmDelete } = useTransactionActions(vi.fn());
    const tx = makeTransaction({ id: "tx-99" });
    handleDeleteClick(tx);
    confirmDelete();
    expect(mockDeleteMutate).toHaveBeenCalledWith("tx-99", expect.any(Object));
    expect(showDeleteConfirm.value).toBe(true); // still open until mutation succeeds
  });

  it("confirmDelete does nothing when deleteTarget is null", () => {
    mockDeleteMutate.mockClear();
    const { confirmDelete } = useTransactionActions(vi.fn());
    confirmDelete();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("handleDuplicate calls createMutation with cloned core fields, pending status and copy suffix", () => {
    mockCreateMutate.mockClear();
    const { handleDuplicate } = useTransactionActions(vi.fn());
    const tx = makeTransaction({
      title: "Aluguel",
      amount: "1200.00",
      type: "expense",
      due_date: "2026-02-05",
      status: "paid",
      tag_id: "t-1",
      account_id: "a-1",
      credit_card_id: "c-1",
      description: "Mensal",
      currency: "BRL",
    } as Partial<TransactionDto>);
    handleDuplicate(tx);
    expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    const [payload] = mockCreateMutate.mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      title: "Aluguel (cópia)",
      amount: "1200.00",
      type: "expense",
      due_date: "2026-02-05",
      status: "pending",
      tag_id: "t-1",
      account_id: "a-1",
      credit_card_id: "c-1",
      description: "Mensal",
      currency: "BRL",
    });
  });

  it("handleDuplicate omits description when source transaction has none", () => {
    mockCreateMutate.mockClear();
    const { handleDuplicate } = useTransactionActions(vi.fn());
    const tx = makeTransaction({ title: "Café", description: null } as Partial<TransactionDto>);
    handleDuplicate(tx);
    const [payload] = mockCreateMutate.mock.calls[0] ?? [];
    expect(payload).not.toHaveProperty("description");
  });
});
