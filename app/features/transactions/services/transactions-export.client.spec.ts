import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  TransactionsExportClient,
  clearTransactionsExportCache,
} from "~/features/transactions/services/transactions-export.client";

/**
 * Creates a minimal HTTP mock for the transactions-export client.
 *
 * @returns HTTP mock with a `get` spy.
 */
const createHttpMock = (): { get: ReturnType<typeof vi.fn> } => {
  return { get: vi.fn() };
};

describe("TransactionsExportClient", () => {
  beforeEach(() => {
    clearTransactionsExportCache();
  });

  it("requests /transactions/export with params and responseType blob", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: new Blob(["hello"], { type: "text/csv" }),
      headers: {
        "content-disposition": "attachment; filename=\"auraxis.csv\"",
        "content-type": "text/csv",
      },
    });

    const client = new TransactionsExportClient(http as never);
    const result = await client.exportTransactions({
      format: "csv",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });

    expect(http.get).toHaveBeenCalledWith("/transactions/export", {
      params: { format: "csv", start_date: "2026-01-01", end_date: "2026-01-31" },
      responseType: "blob",
    });
    expect(result.filename).toBe("auraxis.csv");
    expect(result.contentType).toBe("text/csv");
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("falls back to a dated filename when Content-Disposition is missing", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: new Blob(["pdf-bytes"]),
      headers: {},
    });

    const client = new TransactionsExportClient(http as never);
    const result = await client.exportTransactions({ format: "pdf" });

    expect(result.filename).toMatch(/^auraxis-transactions-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(result.contentType).toBe("application/pdf");
  });

  it("propagates HTTP errors (e.g. 402 paywall) without masking", async () => {
    const http = createHttpMock();
    http.get.mockRejectedValue(new Error("paywall"));

    const client = new TransactionsExportClient(http as never);
    await expect(
      client.exportTransactions({ format: "csv" }),
    ).rejects.toThrow("paywall");
  });

  it("returns cached result on repeated calls with identical filters", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: new Blob(["hello"], { type: "text/csv" }),
      headers: {
        "content-disposition": "attachment; filename=\"auraxis.csv\"",
        "content-type": "text/csv",
      },
    });

    const client = new TransactionsExportClient(http as never);
    const filters = { format: "csv" as const, start_date: "2026-01-01", end_date: "2026-01-31" };

    const first = await client.exportTransactions(filters);
    const second = await client.exportTransactions(filters);

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("treats different filter combinations as independent cache entries", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: new Blob(["payload"], { type: "text/csv" }),
      headers: { "content-type": "text/csv" },
    });

    const client = new TransactionsExportClient(http as never);
    await client.exportTransactions({ format: "csv", start_date: "2026-01-01" });
    await client.exportTransactions({ format: "pdf", start_date: "2026-01-01" });
    await client.exportTransactions({ format: "csv", start_date: "2026-02-01" });

    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it("does not cache errored responses — next call retries the backend", async () => {
    const http = createHttpMock();
    http.get
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        data: new Blob(["ok"], { type: "text/csv" }),
        headers: { "content-type": "text/csv" },
      });

    const client = new TransactionsExportClient(http as never);
    await expect(client.exportTransactions({ format: "csv" })).rejects.toThrow("network down");
    const retry = await client.exportTransactions({ format: "csv" });

    expect(retry.contentType).toBe("text/csv");
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("clearTransactionsExportCache drops all entries", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: new Blob(["x"], { type: "text/csv" }),
      headers: { "content-type": "text/csv" },
    });

    const client = new TransactionsExportClient(http as never);
    await client.exportTransactions({ format: "csv" });
    clearTransactionsExportCache();
    await client.exportTransactions({ format: "csv" });

    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
