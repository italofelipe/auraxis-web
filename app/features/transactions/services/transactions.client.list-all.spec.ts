import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

import { TransactionsClient } from "./transactions.client";
import type { TransactionDto } from "../contracts/transaction.dto";

vi.mock("axios");

const mockedAxiosCreate = vi.mocked(axios.create) as ReturnType<typeof vi.fn>;

/**
 * Builds a minimal TransactionDto fixture.
 *
 * @param overrides Partial overrides applied to the default fixture.
 * @returns A TransactionDto with sensible defaults.
 */
const makeTransaction = (overrides: Partial<TransactionDto> = {}): TransactionDto => ({
  id: "txn-001",
  title: "Test",
  amount: "150.00",
  type: "expense",
  due_date: "2026-06-01",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  recurrence_interval: 1,
  recurrence_unit: "month",
  currency: "BRL",
  status: "pending",
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  impact_policy: "full",
  installment_group_id: null,
  paid_at: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: null,
  ...overrides,
});

describe("TransactionsClient.listAllTransactions", () => {
  let httpGetMock: ReturnType<typeof vi.fn>;
  let client: TransactionsClient;

  beforeEach(() => {
    vi.clearAllMocks();
    httpGetMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({ get: httpGetMock } as never);
    client = new TransactionsClient(axios.create());
  });

  it("requests the first page with a large per_page and returns its items when single-page", async () => {
    const txn = makeTransaction();
    httpGetMock.mockResolvedValueOnce({
      data: {
        data: { transactions: [txn] },
        meta: { pagination: { page: 1, pages: 1, per_page: 100, total: 1 } },
      },
    });

    const result = await client.listAllTransactions({ type: "expense" });

    expect(httpGetMock).toHaveBeenCalledTimes(1);
    expect(httpGetMock).toHaveBeenCalledWith("/transactions", {
      params: { type: "expense", page: 1, per_page: 100 },
    });
    expect(result).toEqual([txn]);
  });

  it("follows pagination and concatenates every page in order", async () => {
    const page1 = [makeTransaction({ id: "p1-a" }), makeTransaction({ id: "p1-b" })];
    const page2 = [makeTransaction({ id: "p2-a" })];
    const page3 = [makeTransaction({ id: "p3-a" })];
    httpGetMock
      .mockResolvedValueOnce({
        data: {
          data: { transactions: page1 },
          meta: { pagination: { page: 1, pages: 3, per_page: 100, total: 4 } },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { transactions: page2 },
          meta: { pagination: { page: 2, pages: 3, per_page: 100, total: 4 } },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { transactions: page3 },
          meta: { pagination: { page: 3, pages: 3, per_page: 100, total: 4 } },
        },
      });

    const result = await client.listAllTransactions({
      type: "expense",
      start_date: "2025-12-01",
      end_date: "2026-06-30",
    });

    expect(httpGetMock).toHaveBeenCalledTimes(3);
    expect(httpGetMock).toHaveBeenNthCalledWith(2, "/transactions", {
      params: {
        type: "expense",
        start_date: "2025-12-01",
        end_date: "2026-06-30",
        page: 2,
        per_page: 100,
      },
    });
    expect(httpGetMock).toHaveBeenNthCalledWith(3, "/transactions", {
      params: {
        type: "expense",
        start_date: "2025-12-01",
        end_date: "2026-06-30",
        page: 3,
        per_page: 100,
      },
    });
    expect(result.map((tx) => tx.id)).toEqual(["p1-a", "p1-b", "p2-a", "p3-a"]);
  });

  it("treats a response without pagination meta as a single complete page", async () => {
    const txn = makeTransaction();
    httpGetMock.mockResolvedValueOnce({ data: { data: { transactions: [txn] } } });

    const result = await client.listAllTransactions();

    expect(httpGetMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([txn]);
  });

  it("handles a bare array response as a single page", async () => {
    const txn = makeTransaction();
    httpGetMock.mockResolvedValueOnce({ data: [txn] });

    const result = await client.listAllTransactions();

    expect(httpGetMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([txn]);
  });

  it("propagates network errors without catching them", async () => {
    httpGetMock.mockRejectedValueOnce(new Error("network error"));

    await expect(client.listAllTransactions()).rejects.toThrow("network error");
  });
});
