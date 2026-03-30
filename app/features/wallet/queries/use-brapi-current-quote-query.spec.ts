import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBrapiCurrentQuoteQuery } from "./use-brapi-current-quote-query";
import type { BrapiCurrentQuote } from "~/features/wallet/services/brapi.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Minimal BrapiCurrentQuote fixture.
 *
 * @returns BrapiCurrentQuote for PETR4 with current market data.
 */
const makeCurrentQuote = (): BrapiCurrentQuote => ({
  ticker: "PETR4",
  shortName: "Petrobras PN",
  price: 38.5,
  change: 0.5,
  changePercent: 1.32,
  currency: "BRL",
});

describe("useBrapiCurrentQuoteQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useQuery and passes the queryFn to it", () => {
    const ticker = ref("PETR4");
    const mockClient = { getCurrentQuote: vi.fn().mockResolvedValue(makeCurrentQuote()) };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    useBrapiCurrentQuoteQuery(ticker, mockClient as never);

    expect(useQueryMock).toHaveBeenCalledOnce();
  });

  it("queryFn calls client.getCurrentQuote with the current ticker value", async () => {
    const ticker = ref("PETR4");
    const mockClient = { getCurrentQuote: vi.fn().mockResolvedValue(makeCurrentQuote()) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiCurrentQuote | null> }) => opts,
    );

    const result = useBrapiCurrentQuoteQuery(ticker, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiCurrentQuote | null>;
    };

    const data = await result.queryFn();

    expect(mockClient.getCurrentQuote).toHaveBeenCalledWith("PETR4");
    expect(data).toEqual(makeCurrentQuote());
  });

  it("queryFn returns null when the client returns null", async () => {
    const ticker = ref("PETR4");
    const mockClient = { getCurrentQuote: vi.fn().mockResolvedValue(null) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiCurrentQuote | null> }) => opts,
    );

    const result = useBrapiCurrentQuoteQuery(ticker, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiCurrentQuote | null>;
    };

    expect(await result.queryFn()).toBeNull();
  });

  it("queryFn propagates errors from client.getCurrentQuote without catching them", async () => {
    const ticker = ref("PETR4");
    const mockClient = {
      getCurrentQuote: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<BrapiCurrentQuote | null> }) => opts,
    );

    const result = useBrapiCurrentQuoteQuery(ticker, mockClient as never) as unknown as {
      queryFn: () => Promise<BrapiCurrentQuote | null>;
    };

    await expect(result.queryFn()).rejects.toThrow("network error");
  });

  it("uses a staleTime of 1 minute (current prices change frequently)", () => {
    const ticker = ref("PETR4");
    const mockClient = { getCurrentQuote: vi.fn() };
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const result = useBrapiCurrentQuoteQuery(
      ticker,
      mockClient as never,
    ) as unknown as { staleTime: number };

    expect(result.staleTime).toBe(60 * 1000);
  });
});
