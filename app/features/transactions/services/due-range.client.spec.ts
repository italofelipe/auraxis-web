import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";

import type { DueRangeResponseDto } from "~/features/transactions/contracts/due-range.dto";

const { useHttpMock } = vi.hoisted(() => ({ useHttpMock: vi.fn() }));
vi.mock("~/composables/useHttp", () => ({ useHttp: useHttpMock }));

const { useDueRangeClient } = await import("./due-range.client");

const innerPayload: DueRangeResponseDto = {
  transactions: [
    {
      id: "tx-1",
      title: "Conta de luz",
      amount: "485.00",
      type: "expense",
      due_date: "2026-06-10",
      status: "pending",
      tag_id: null,
      account_id: null,
      credit_card_id: null,
      is_recurring: false,
    },
  ],
  total: 1,
  page: 1,
  per_page: 10,
  counts: { total: 1, overdue: 0, pending: 1 },
};

describe("useDueRangeClient.getDueRange", () => {
  it("unwraps the v2 envelope ({data:{transactions,counts}})", async () => {
    const get = vi.fn().mockResolvedValueOnce({
      data: { success: true, message: "ok", data: innerPayload },
    });
    useHttpMock.mockReturnValue({ get } as unknown as AxiosInstance);

    const result = await useDueRangeClient().getDueRange({ start_date: "2026-06-03" });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]?.title).toBe("Conta de luz");
    expect(get).toHaveBeenCalledWith("/transactions/due-range", {
      params: { start_date: "2026-06-03" },
    });
  });

  it("accepts a flat (non-enveloped) body for backward compatibility", async () => {
    const get = vi.fn().mockResolvedValueOnce({ data: innerPayload });
    useHttpMock.mockReturnValue({ get } as unknown as AxiosInstance);

    const result = await useDueRangeClient().getDueRange();

    expect(result.transactions).toHaveLength(1);
  });
});
