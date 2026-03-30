import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListTransactionsQuery } from "./use-list-transactions-query";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal TransactionDto fixture for test assertions.
 *
 * @returns Pending income transaction fixture.
 */
const makeTransactionDto = (): TransactionDto => ({
  id: "txn-1",
  title: "Salário",
  amount: "5000.00",
  type: "income",
  due_date: "2026-03-31",
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

describe("useListTransactionsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: unknown) => opts);
  });

  it("calls client.listTransactions without filters by default", async () => {
    const dto = makeTransactionDto();
    const client = { listTransactions: vi.fn().mockResolvedValue([dto]) };

    const query = useListTransactionsQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    const result = await query.queryFn();

    expect(client.listTransactions).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([dto]);
  });

  it("passes filters to client.listTransactions", async () => {
    const client = { listTransactions: vi.fn().mockResolvedValue([]) };
    const filters = { type: "income" as const, status: "pending" as const };

    const query = useListTransactionsQuery(filters, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await query.queryFn();

    expect(client.listTransactions).toHaveBeenCalledWith(filters);
  });

  it("propagates errors from client.listTransactions without catching", async () => {
    const client = {
      listTransactions: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const query = useListTransactionsQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });

  it("includes filters in the queryKey for cache isolation", () => {
    const client = { listTransactions: vi.fn().mockResolvedValue([]) };
    const filters = { type: "expense" as const };

    const query = useListTransactionsQuery(filters, client as never) as unknown as {
      queryKey: readonly unknown[];
    };

    expect(query.queryKey).toEqual(["transactions", "list", filters]);
  });
});
