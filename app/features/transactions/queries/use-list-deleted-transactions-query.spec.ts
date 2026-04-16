import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListDeletedTransactionsQuery } from "./use-list-deleted-transactions-query";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal TransactionDto fixture for assertions.
 *
 * @returns Deleted expense transaction fixture.
 */
const makeDeletedTransactionDto = (): TransactionDto => ({
  id: "txn-del-1",
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
  updated_at: "2026-03-01T00:00:00.000Z",
});

describe("useListDeletedTransactionsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: unknown) => opts);
  });

  it("uses the ['transactions', 'deleted'] queryKey for cache isolation", () => {
    const client = { listDeletedTransactions: vi.fn().mockResolvedValue([]) };

    const query = useListDeletedTransactionsQuery(client as never) as unknown as {
      queryKey: readonly unknown[];
    };

    expect(query.queryKey).toEqual(["transactions", "deleted"]);
  });

  it("calls client.listDeletedTransactions and returns the result", async () => {
    const dto = makeDeletedTransactionDto();
    const client = { listDeletedTransactions: vi.fn().mockResolvedValue([dto]) };

    const query = useListDeletedTransactionsQuery(client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    const result = await query.queryFn();

    expect(client.listDeletedTransactions).toHaveBeenCalledWith();
    expect(result).toEqual([dto]);
  });

  it("propagates errors from client.listDeletedTransactions without catching", async () => {
    const client = {
      listDeletedTransactions: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const query = useListDeletedTransactionsQuery(client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
