import { describe, expect, it, vi } from "vitest";

import { WalletClient } from "./wallet.client";
import type { WalletSummaryDto } from "~/features/wallet/contracts/wallet.dto";

/**
 * Creates a minimal Axios-like HTTP mock with a `get` spy.
 *
 * @returns Object with a `get` spy method.
 */
const createHttpMock = (): { get: ReturnType<typeof vi.fn> } => ({
  get: vi.fn(),
});

/**
 * Builds a minimal WalletSummaryDto fixture for testing.
 *
 * @returns WalletSummaryDto fixture with one position.
 */
const makeWalletSummaryDto = (): WalletSummaryDto => ({
  total_patrimony: 87500,
  invested_value: 72000,
  current_value: 87500,
  period_variation: 15500,
  period_variation_pct: 21.53,
  last_updated: "2026-03-17T00:00:00.000Z",
  positions: [
    {
      id: "p-1",
      name: "Ações Brasil",
      ticker: "BOVA11",
      category: "Renda Variável",
      invested: 10000,
      current_value: 11500,
      variation_pct: 15.0,
    },
  ],
});

describe("WalletClient", () => {
  it("calls GET /wallet/summary and returns mapped view model", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({ data: makeWalletSummaryDto() });

    const client = new WalletClient(http as never);
    const result = await client.getSummary();

    expect(http.get).toHaveBeenCalledWith("/wallet/summary");
    expect(result.totalPatrimony).toBe(87500);
    expect(result.investedValue).toBe(72000);
    expect(result.periodVariationPct).toBe(21.53);
  });

  it("maps positions array from the response DTO", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({ data: makeWalletSummaryDto() });

    const client = new WalletClient(http as never);
    const result = await client.getSummary();

    expect(result.positions).toHaveLength(1);
    const firstPosition = result.positions[0];
    expect(firstPosition?.id).toBe("p-1");
    expect(firstPosition?.currentValue).toBe(11500);
    expect(firstPosition?.variationPct).toBe(15.0);
  });

  it("propagates network errors without swallowing them", async () => {
    const http = createHttpMock();
    http.get.mockRejectedValue(new Error("connection refused"));

    const client = new WalletClient(http as never);

    await expect(client.getSummary()).rejects.toThrow("connection refused");
  });
});
