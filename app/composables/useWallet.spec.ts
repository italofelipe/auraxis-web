import type { WalletSummary } from "~/types/contracts";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createWalletApi, useWalletSummaryQuery } from "./useWallet";

const useQueryMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
}));

vi.mock("#app", () => ({
  useRuntimeConfig: (): { public: Record<string, unknown> } => ({
    public: { mockData: "false" },
  }),
}));

describe("useWallet composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("retorna resumo remoto quando query executa com sucesso", async () => {
    const remoteSummary: WalletSummary = {
      total: 3210,
      assets: [{ id: "asset-1", name: "Reserva", amount: 3210, allocation: 100 }],
    };

    useHttpMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: remoteSummary }),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<WalletSummary> }) => options);

    const query = useWalletSummaryQuery() as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };
    const result = await query.queryFn();

    expect(result).toEqual(remoteSummary);
  });

  it("propaga erro quando backend falha", async () => {
    useHttpMock.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("timeout")),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<WalletSummary> }) => options);

    const query = useWalletSummaryQuery() as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };

    await expect(query.queryFn()).rejects.toThrow("timeout");
  });
});
