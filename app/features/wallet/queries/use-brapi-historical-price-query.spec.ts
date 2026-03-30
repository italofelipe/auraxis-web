import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBrapiHistoricalPriceQuery } from "./use-brapi-historical-price-query";
import type { BrapiHistoricalPrice } from "~/features/wallet/services/brapi.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Minimal BrapiHistoricalPrice fixture.
 *
 * @returns BrapiHistoricalPrice for PETR4 on 2021-06-13.
 */
const makeHistoricalPrice = (): BrapiHistoricalPrice => ({
  ticker: "PETR4",
  date: "2021-06-13",
  price: 28.5,
  currency: "BRL",
});

describe("useBrapiHistoricalPriceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useQuery and passes the queryFn to it", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockClient = { getHistoricalPrice: vi.fn().mockResolvedValue(makeHistoricalPrice()) };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    useBrapiHistoricalPriceQuery(ticker, date, mockClient as never);

    expect(useQueryMock).toHaveBeenCalledOnce();
  });

  it("queryFn calls client.getHistoricalPrice with ticker and date values", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockClient = { getHistoricalPrice: vi.fn().mockResolvedValue(makeHistoricalPrice()) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    const data = await result.queryFn();

    expect(mockClient.getHistoricalPrice).toHaveBeenCalledWith("PETR4", "2021-06-13");
    expect(data).toEqual(makeHistoricalPrice());
  });

  it("queryFn returns null when the client returns null", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockClient = { getHistoricalPrice: vi.fn().mockResolvedValue(null) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    expect(await result.queryFn()).toBeNull();
  });

  it("queryFn propagates errors from client.getHistoricalPrice without catching them", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockClient = {
      getHistoricalPrice: vi.fn().mockRejectedValue(new Error("timeout")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    await expect(result.queryFn()).rejects.toThrow("timeout");
  });

  it("uses a staleTime of 30 minutes (historical prices are immutable)", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockClient = { getHistoricalPrice: vi.fn() };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const result = useBrapiHistoricalPriceQuery(
      ticker,
      date,
      mockClient as never,
    ) as unknown as { staleTime: number };

    expect(result.staleTime).toBe(30 * 60 * 1000);
  });
});
