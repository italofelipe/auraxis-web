import { describe, expect, it, vi } from "vitest";

import { createWalletApi } from "./useWallet";

describe("createWalletApi", () => {
  it("busca resumo da carteira no endpoint correto", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        total: 1000,
        assets: [
          { id: "1", name: "Reserva", amount: 700, allocation: 70 },
          { id: "2", name: "Acoes", amount: 300, allocation: 30 },
        ],
      },
    });

    const walletApi = createWalletApi({ get });
    const response = await walletApi.getSummary();

    expect(get).toHaveBeenCalledWith("/wallet/summary");
    expect(response.total).toBe(1000);
    expect(response.assets).toHaveLength(2);
  });
});
