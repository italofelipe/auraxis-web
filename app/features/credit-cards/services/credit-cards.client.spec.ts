import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditCardsClient } from "./credit-cards.client";

/**
 * Constrói um client com adapter Axios mockado.
 *
 * @returns Client de teste e o mock de get.
 */
const makeClient = (): {
  readonly client: CreditCardsClient;
  readonly get: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const http = { get } as unknown as AxiosInstance;
  return { client: new CreditCardsClient(http), get };
};

const RAW_CYCLE = {
  start_date: "2026-06-01",
  end_date: "2026-06-30",
  due_date: "2026-07-10",
  status: "open",
};

describe("CreditCardsClient.getBill", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chama /bill com month e desembrulha + coage", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          cycle: RAW_CYCLE,
          transactions: [],
          total_amount: "1200.00",
          paid_amount: "200.00",
          pending_amount: "1000.00",
        },
      },
    });

    const bill = await client.getBill("cc-1", "2026-06");

    expect(get).toHaveBeenCalledWith("/credit-cards/cc-1/bill", {
      params: { month: "2026-06" },
    });
    expect(bill.totalAmount).toBe(1200);
    expect(bill.pendingAmount).toBe(1000);
  });

  it("omite params quando month não é informado", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        cycle: RAW_CYCLE,
        transactions: [],
        total_amount: "0.00",
        paid_amount: "0.00",
        pending_amount: "0.00",
      },
    });

    await client.getBill("cc-1");
    expect(get).toHaveBeenCalledWith("/credit-cards/cc-1/bill", {
      params: undefined,
    });
  });
});

describe("CreditCardsClient.getUtilization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chama /utilization e coage amounts", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        cycle: RAW_CYCLE,
        committed_amount: "3250.00",
        available_amount: "1750.00",
        limit_amount: "5000.00",
        utilization_pct: 65,
      },
    });

    const u = await client.getUtilization("cc-1");
    expect(get).toHaveBeenCalledWith("/credit-cards/cc-1/utilization");
    expect(u.utilizationPct).toBe(65);
    expect(u.committedAmount).toBe(3250);
  });
});
