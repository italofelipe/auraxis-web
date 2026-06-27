import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListAllTransactionsQuery } from "./use-list-all-transactions-query";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useListAllTransactionsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: unknown) => opts);
  });

  it("calls client.listAllTransactions without filters by default", async () => {
    const client = { listAllTransactions: vi.fn().mockResolvedValue([]) };

    const query = useListAllTransactionsQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await query.queryFn();

    expect(client.listAllTransactions).toHaveBeenCalledWith(undefined);
  });

  it("passes filters to client.listAllTransactions", async () => {
    const client = { listAllTransactions: vi.fn().mockResolvedValue([]) };
    const filters = { type: "expense" as const, start_date: "2026-01-01", end_date: "2026-06-30" };

    const query = useListAllTransactionsQuery(filters, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await query.queryFn();

    expect(client.listAllTransactions).toHaveBeenCalledWith(filters);
  });

  it("isolates the cache from the paginated list under a distinct queryKey", () => {
    const client = { listAllTransactions: vi.fn().mockResolvedValue([]) };
    const filters = { type: "expense" as const };

    const query = useListAllTransactionsQuery(filters, client as never) as unknown as {
      queryKey: readonly unknown[];
    };

    expect(query.queryKey).toEqual(["transactions", "list-all", filters]);
  });

  it("propagates errors from client.listAllTransactions without catching", async () => {
    const client = {
      listAllTransactions: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const query = useListAllTransactionsQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<TransactionDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
