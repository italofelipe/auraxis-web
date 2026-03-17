import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWalletSummaryQuery } from "./use-wallet-summary-query";
import type { WalletSummary } from "~/features/wallet/model/wallet";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal WalletSummary fixture for testing.
 *
 * @returns WalletSummary fixture with empty positions.
 */
const makeWalletSummary = (): WalletSummary => ({
  totalPatrimony: 87500,
  investedValue: 72000,
  currentValue: 87500,
  periodVariation: 15500,
  periodVariationPct: 21.53,
  lastUpdated: "2026-03-17T00:00:00.000Z",
  positions: [],
});

describe("useWalletSummaryQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical wallet summary query key", () => {
    const client = { getSummary: vi.fn().mockResolvedValue(makeWalletSummary()) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useWalletSummaryQuery(client as never) as unknown as {
      queryKey: readonly ["wallet", "summary"];
    };

    expect(query.queryKey).toEqual(["wallet", "summary"]);
  });

  it("calls client.getSummary and returns the mapped summary", async () => {
    const summary = makeWalletSummary();
    const client = { getSummary: vi.fn().mockResolvedValue(summary) };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<WalletSummary> }) => opts);

    const query = useWalletSummaryQuery(client as never) as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };

    const result = await query.queryFn();

    expect(client.getSummary).toHaveBeenCalledOnce();
    expect(result).toEqual(summary);
  });

  it("propagates error from client.getSummary without catching it", async () => {
    const client = {
      getSummary: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<WalletSummary> }) => opts);

    const query = useWalletSummaryQuery(client as never) as unknown as {
      queryFn: () => Promise<WalletSummary>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
