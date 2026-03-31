import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateTransactionMutation } from "./use-update-transaction-mutation";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { useMutationMock, useQueryClientMock, invalidateQueriesMock } = vi.hoisted(() => {
  const invalidateQueriesMock = vi.fn().mockResolvedValue(undefined);
  return {
    useMutationMock: vi.fn(),
    useQueryClientMock: vi.fn(() => ({ invalidateQueries: invalidateQueriesMock })),
    invalidateQueriesMock,
  };
});

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

/**
 * Builds a minimal TransactionDto fixture for test assertions.
 *
 * @returns A pending income transaction fixture.
 */
const makeTransactionDto = (): TransactionDto => ({
  id: "txn-42",
  title: "Salário atualizado",
  amount: "6000.00",
  type: "income",
  due_date: "2026-04-01",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  currency: "BRL",
  status: "pending",
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  installment_group_id: null,
  paid_at: null,
  created_at: "2026-03-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
});

describe("useUpdateTransactionMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("calls client.updateTransaction with id and payload", async () => {
    const dto = makeTransactionDto();
    const client = { updateTransaction: vi.fn().mockResolvedValue(dto) };

    const mutation = useUpdateTransactionMutation(client as never) as unknown as {
      mutationFn: (args: { id: string; payload: { title: string } }) => Promise<TransactionDto>;
    };

    const result = await mutation.mutationFn({ id: "txn-42", payload: { title: "Salário atualizado" } });

    expect(client.updateTransaction).toHaveBeenCalledWith("txn-42", { title: "Salário atualizado" });
    expect(result).toEqual(dto);
  });

  it("invalidates transactions list cache on success", async () => {
    const client = { updateTransaction: vi.fn().mockResolvedValue(makeTransactionDto()) };

    const mutation = useUpdateTransactionMutation(client as never) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["transactions", "list"] });
  });

  it("propagates client errors without catching", async () => {
    const client = {
      updateTransaction: vi.fn().mockRejectedValue(new Error("update failed")),
    };

    const mutation = useUpdateTransactionMutation(client as never) as unknown as {
      mutationFn: (args: { id: string; payload: object }) => Promise<TransactionDto>;
    };

    await expect(mutation.mutationFn({ id: "txn-1", payload: {} })).rejects.toThrow("update failed");
  });

  it("accepts a partial payload with only changed fields", async () => {
    const dto = makeTransactionDto();
    const client = { updateTransaction: vi.fn().mockResolvedValue(dto) };

    const mutation = useUpdateTransactionMutation(client as never) as unknown as {
      mutationFn: (args: { id: string; payload: object }) => Promise<TransactionDto>;
    };

    await mutation.mutationFn({ id: "txn-42", payload: { status: "paid" } });

    expect(client.updateTransaction).toHaveBeenCalledWith("txn-42", { status: "paid" });
  });
});
