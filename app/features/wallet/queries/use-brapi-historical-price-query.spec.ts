import { ref, type ComputedRef } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBrapiHistoricalPriceQuery, type BrapiHistoricalPriceQueryDeps } from "./use-brapi-historical-price-query";
import type { BrapiHistoricalPrice } from "~/features/wallet/services/brapi.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("#app", (): Record<string, unknown> => ({
  useRuntimeConfig: (): { public: { brapiApiKey: string } } => ({
    public: { brapiApiKey: "test-api-key" },
  }),
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

/**
 * Minimal mock client with a configured api key override so no Nuxt context is needed.
 *
 * @param resolvedValue - Value resolved by getHistoricalPrice.
 * @returns BrapiHistoricalPriceQueryDeps with mock client and api key.
 */
const makeDeps = (resolvedValue: BrapiHistoricalPrice | null = makeHistoricalPrice()): BrapiHistoricalPriceQueryDeps => ({
  client: { getHistoricalPrice: vi.fn().mockResolvedValue(resolvedValue) as never },
  brapiApiKey: "test-api-key",
});

describe("useBrapiHistoricalPriceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useQuery and passes the queryFn to it", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    useQueryMock.mockImplementation((opts: unknown) => opts);

    useBrapiHistoricalPriceQuery(ticker, date, makeDeps());

    expect(useQueryMock).toHaveBeenCalledOnce();
  });

  it("queryFn calls client.getHistoricalPrice with ticker and date values", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const mockFn = vi.fn().mockResolvedValue(makeHistoricalPrice());
    const deps: BrapiHistoricalPriceQueryDeps = {
      client: { getHistoricalPrice: mockFn as never },
      brapiApiKey: "test-api-key",
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, deps) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    const data = await result.queryFn();

    expect(mockFn).toHaveBeenCalledWith("PETR4", "2021-06-13");
    expect(data).toEqual(makeHistoricalPrice());
  });

  it("queryFn returns null when the client returns null", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const deps = makeDeps(null);
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, deps) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    expect(await result.queryFn()).toBeNull();
  });

  it("queryFn propagates errors from client.getHistoricalPrice without catching them", async () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const deps: BrapiHistoricalPriceQueryDeps = {
      client: { getHistoricalPrice: vi.fn().mockRejectedValue(new Error("timeout")) as never },
      brapiApiKey: "test-api-key",
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiHistoricalPrice | null> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(ticker, date, deps) as unknown as {
      queryFn: () => Promise<BrapiHistoricalPrice | null>;
    };

    await expect(result.queryFn()).rejects.toThrow("timeout");
  });

  it("uses a staleTime of 30 minutes (historical prices are immutable)", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const result = useBrapiHistoricalPriceQuery(
      ticker,
      date,
      makeDeps(),
    ) as unknown as { staleTime: number };

    expect(result.staleTime).toBe(30 * 60 * 1000);
  });

  it("query enabled is false when brapiApiKey is empty", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");
    const deps: BrapiHistoricalPriceQueryDeps = {
      client: { getHistoricalPrice: vi.fn() as never },
      brapiApiKey: "",
    };

    useQueryMock.mockImplementation(
      (opts: { enabled: ComputedRef<boolean> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(
      ticker,
      date,
      deps,
    ) as unknown as { enabled: ComputedRef<boolean> };

    expect(result.enabled.value).toBe(false);
  });

  it("query enabled is true when all conditions are met", () => {
    const ticker = ref("PETR4");
    const date = ref("2021-06-13");

    useQueryMock.mockImplementation(
      (opts: { enabled: ComputedRef<boolean> }) => opts,
    );

    const result = useBrapiHistoricalPriceQuery(
      ticker,
      date,
      makeDeps(),
    ) as unknown as { enabled: ComputedRef<boolean> };

    expect(result.enabled.value).toBe(true);
  });
});
