import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWalletSummaryQuery, type WalletSummary } from "./useWallet";

const useQueryMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

describe("useWallet composable facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to the feature-level query with the correct query key", () => {
    const mockClient = {
      getSummary: vi.fn().mockResolvedValue({} as WalletSummary),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useWalletSummaryQuery(mockClient as never) as unknown as {
      queryKey: readonly ["wallet", "summary"];
      queryFn: () => Promise<WalletSummary>;
    };

    expect(query.queryKey).toEqual(["wallet", "summary"]);
  });

  it("calls client.getSummary when mock mode is disabled", async () => {
    const remoteSummary: WalletSummary = {
      totalPatrimony: 50000,
      investedValue: 40000,
      currentValue: 50000,
      periodVariation: 10000,
      periodVariationPct: 25.0,
      positions: [],
      lastUpdated: "2026-03-17T00:00:00.000Z",
    };

    const mockClient = {
      getSummary: vi.fn().mockResolvedValue(remoteSummary),
    };

    useQueryMock.mockImplementation((options: { queryFn: () => Promise<WalletSummary> }) => options);

    const query = useWalletSummaryQuery(mockClient as never) as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };

    const result = await query.queryFn();

    expect(mockClient.getSummary).toHaveBeenCalledOnce();
    expect(result).toEqual(remoteSummary);
  });

  it("propagates error when client.getSummary rejects", async () => {
    const mockClient = {
      getSummary: vi.fn().mockRejectedValue(new Error("network failure")),
    };

    useQueryMock.mockImplementation((options: { queryFn: () => Promise<WalletSummary> }) => options);

    const query = useWalletSummaryQuery(mockClient as never) as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };

    await expect(query.queryFn()).rejects.toThrow("network failure");
  });
});
