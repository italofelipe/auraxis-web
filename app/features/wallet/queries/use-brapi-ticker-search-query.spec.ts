import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBrapiTickerSearchQuery } from "./use-brapi-ticker-search-query";
import type { BrapiTickerSearchResult } from "~/features/wallet/services/brapi.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Minimal BrapiTickerSearchResult fixture.
 *
 * @returns BrapiTickerSearchResult with PETR4 data.
 */
const makeResult = (): BrapiTickerSearchResult => ({
  stock: "PETR4",
  name: "Petrobras PN",
  close: 38.5,
  change: 0.5,
  volume: 10_000_000,
  market_cap_basic: 500_000_000,
  logo: null,
  sector: "Energia",
});

describe("useBrapiTickerSearchQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useQuery and passes the queryFn to it", () => {
    const query = ref("PETR");
    const mockClient = { searchTickers: vi.fn().mockResolvedValue([makeResult()]) };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    useBrapiTickerSearchQuery(query, mockClient as never);

    expect(useQueryMock).toHaveBeenCalledOnce();
  });

  it("queryFn calls client.searchTickers with the current query value", async () => {
    const query = ref("PETR");
    const mockClient = { searchTickers: vi.fn().mockResolvedValue([makeResult()]) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiTickerSearchResult[]> }) => opts,
    );

    const result = useBrapiTickerSearchQuery(query, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiTickerSearchResult[]>;
    };

    const data = await result.queryFn();

    expect(mockClient.searchTickers).toHaveBeenCalledWith("PETR");
    expect(data).toEqual([makeResult()]);
  });

  it("queryFn propagates errors from client.searchTickers without catching them", async () => {
    const query = ref("PETR");
    const mockClient = {
      searchTickers: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiTickerSearchResult[]> }) => opts,
    );

    const result = useBrapiTickerSearchQuery(query, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiTickerSearchResult[]>;
    };

    await expect(result.queryFn()).rejects.toThrow("network error");
  });

  it("uses a staleTime of 5 minutes", () => {
    const query = ref("PETR");
    const mockClient = { searchTickers: vi.fn() };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const result = useBrapiTickerSearchQuery(query, mockClient as never) as unknown as {
      staleTime: number;
    };

    expect(result.staleTime).toBe(5 * 60 * 1000);
  });
});
