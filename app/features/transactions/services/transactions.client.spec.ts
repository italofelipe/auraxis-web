import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { TransactionsClient } from "./transactions.client";
import type { CreateTransactionPayload, TransactionDto } from "../contracts/transaction.dto";

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
  due_date: "2024-06-01",
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
  created_at: "2024-06-01T00:00:00Z",
  updated_at: null,
  ...overrides,
});

/**
 * Minimal valid create payload.
 *
 * @returns A CreateTransactionPayload fixture.
 */
const makePayload = (): CreateTransactionPayload => ({
  title: "Test",
  amount: "150.00",
  type: "expense",
  due_date: "2024-06-01",
});

describe("TransactionsClient", () => {
  let httpPostMock: ReturnType<typeof vi.fn>;
  let client: TransactionsClient;

  beforeEach(() => {
    vi.clearAllMocks();
    httpPostMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({ post: httpPostMock } as never);
    client = new TransactionsClient(axios.create());
  });

  describe("createTransaction", () => {
    it("posts to /transactions with the payload", async () => {
      const txn = makeTransaction();
      httpPostMock.mockResolvedValueOnce({
        data: { data: { transaction: [txn] } },
      });

      await client.createTransaction(makePayload());

      expect(httpPostMock).toHaveBeenCalledWith("/transactions", makePayload());
    });

    it("returns array from data.transactions envelope", async () => {
      const txn = makeTransaction();
      httpPostMock.mockResolvedValueOnce({
        data: { data: { transactions: [txn] } },
      });

      const result = await client.createTransaction(makePayload());

      expect(result).toEqual([txn]);
    });

    it("returns array from data.transaction envelope", async () => {
      const txn = makeTransaction();
      httpPostMock.mockResolvedValueOnce({
        data: { data: { transaction: [txn] } },
      });

      const result = await client.createTransaction(makePayload());

      expect(result).toEqual([txn]);
    });

    it("normalises a single object (non-array) to a one-element array", async () => {
      const txn = makeTransaction();
      httpPostMock.mockResolvedValueOnce({
        data: { data: { transaction: txn } },
      });

      const result = await client.createTransaction(makePayload());

      expect(result).toEqual([txn]);
    });

    it("returns flat legacy shape from root-level transactions key", async () => {
      const txn = makeTransaction();
      httpPostMock.mockResolvedValueOnce({
        data: { transactions: [txn] },
      });

      const result = await client.createTransaction(makePayload());

      expect(result).toEqual([txn]);
    });

    it("propagates network errors without catching them", async () => {
      httpPostMock.mockRejectedValueOnce(new Error("network error"));

      await expect(client.createTransaction(makePayload())).rejects.toThrow("network error");
    });
  });
});
