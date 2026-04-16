import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRestoreTransactionMutation } from "./use-restore-transaction-mutation";
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
 * Builds a minimal TransactionDto fixture for assertions.
 *
 * @returns Restored expense transaction fixture.
 */
const makeTransactionDto = (): TransactionDto => ({
  id: "txn-restore-1",
  title: "Mercado",
  amount: "120.00",
  type: "expense",
  due_date: "2026-03-20",
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
  updated_at: "2026-03-10T00:00:00.000Z",
});

describe("useRestoreTransactionMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((opts: unknown) => opts);
  });

  it("calls client.restoreTransaction with the given id", async () => {
    const dto = makeTransactionDto();
    const client = { restoreTransaction: vi.fn().mockResolvedValue(dto) };

    const mutation = useRestoreTransactionMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<TransactionDto>;
    };

    const result = await mutation.mutationFn("txn-restore-1");

    expect(client.restoreTransaction).toHaveBeenCalledWith("txn-restore-1");
    expect(result).toEqual(dto);
  });

  it("invalidates both active list and deleted list on success", async () => {
    const client = { restoreTransaction: vi.fn().mockResolvedValue(makeTransactionDto()) };

    const mutation = useRestoreTransactionMutation(client as never) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["transactions", "list"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["transactions", "deleted"] });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2);
  });

  it("propagates errors from client.restoreTransaction without catching", async () => {
    const client = {
      restoreTransaction: vi.fn().mockRejectedValue(new Error("restore failed")),
    };

    const mutation = useRestoreTransactionMutation(client as never) as unknown as {
      mutationFn: (id: string) => Promise<TransactionDto>;
    };

    await expect(mutation.mutationFn("txn-x")).rejects.toThrow("restore failed");
  });
});
