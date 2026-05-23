import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletClient } from "./wallet.client";

describe("WalletClient", () => {
  let http: AxiosInstance;
  let client: WalletClient;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
    client = new WalletClient(http);
  });

  it("normalizes nullable and string portfolio summary numbers", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: {
          summary: {
            total_current_value: "100290.25",
            total_invested_amount: null,
            total_profit_loss_percent: "NaN",
            total_investments: undefined,
          },
        },
      },
    });

    await expect(client.getPortfolioSummary()).resolves.toEqual({
      total_value: 100290.25,
      total_cost: 0,
      day_change_percent: null,
      total_return_percent: 0,
      asset_count: 0,
    });
  });

  it("normalizes wallet entries so the UI never receives non-finite numbers", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              id: "wallet-1",
              name: "PETR4",
              ticker: "PETR4",
              asset_type: "stock",
              quantity: "1000",
              current_value: null,
              cost_basis: "invalid",
              change_percent: "NaN",
              register_date: "2026-05-20",
            },
          ],
        },
      },
    });

    await expect(client.getEntries()).resolves.toEqual([
      {
        id: "wallet-1",
        name: "PETR4",
        ticker: "PETR4",
        asset_type: "stock",
        quantity: 1000,
        current_value: 0,
        cost_basis: 0,
        change_percent: null,
        register_date: "2026-05-20",
      },
    ]);
  });
});
