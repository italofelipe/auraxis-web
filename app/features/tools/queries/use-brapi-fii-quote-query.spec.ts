import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/vue-query";

import { useBrapiFiiQuoteQuery } from "./use-brapi-fii-quote-query";
import type { BrapiFiiQuoteResult, BrapiToolsClient } from "~/features/tools/services/brapi-tools.client";

// ─── Mock @tanstack/vue-query ─────────────────────────────────────────────────

vi.mock("@tanstack/vue-query", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

/** Options passed to the useQuery mock. */
type CapturedOptions = {
  queryKey?: unknown;
  queryFn?: () => Promise<unknown>;
  enabled?: unknown;
  staleTime?: number;
  retry?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockFiiData: BrapiFiiQuoteResult = {
  symbol: "MXRF11",
  shortName: "MAXI RENDA FII",
  regularMarketPrice: 10.50,
  regularMarketChangePercent: 0.19,
  currency: "BRL",
  cashDividends: [
    { paymentDate: "2024-12-15", adjustedValue: 0.09, type: "Rendimento" },
  ],
};

/**
 * Builds a minimal mock BrapiToolsClient for tests.
 *
 * @param data - FII quote data to return from getFiiQuote.
 * @returns Mock BrapiToolsClient.
 */
function buildMockClient(data: BrapiFiiQuoteResult | null = mockFiiData): BrapiToolsClient {
  return {
    getCurrencyQuotes: vi.fn(),
    getFiiQuote: vi.fn().mockResolvedValue(data),
  } as unknown as BrapiToolsClient;
}

/**
 * Sets up a capturing mock implementation for useQuery and runs the hook.
 *
 * @param ticker - Ticker ref to pass to the hook.
 * @param client - Mock client to inject.
 * @returns Captured options object.
 */
function captureQueryOpts(
  ticker: ReturnType<typeof ref<string>>,
  client: BrapiToolsClient,
): CapturedOptions {
  let opts: CapturedOptions = {};
  mockUseQuery.mockImplementation((o: CapturedOptions) => {
    opts = o;
    return {
      data: ref(mockFiiData),
      isLoading: ref(false),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as ReturnType<typeof useQuery>;
  });
  useBrapiFiiQuoteQuery(ticker, client);
  return opts;
}

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseQuery.mockReturnValue({
    data: ref(mockFiiData),
    isLoading: ref(false),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  } as ReturnType<typeof useQuery>);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useBrapiFiiQuoteQuery", () => {
  it("returns data from useQuery", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();
    const result = useBrapiFiiQuoteQuery(ticker, client);

    expect(result.data.value).toEqual(mockFiiData);
  });

  it("is disabled when ticker is empty string", () => {
    const ticker = ref("");
    const client = buildMockClient(null);
    const opts = captureQueryOpts(ticker, client);

    const enabled = typeof opts.enabled === "object" && opts.enabled !== null
      ? (opts.enabled as { value: boolean }).value
      : opts.enabled;
    expect(enabled).toBe(false);
  });

  it("is disabled when ticker has fewer than 4 characters", () => {
    const ticker = ref("MXR");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    const enabled = typeof opts.enabled === "object" && opts.enabled !== null
      ? (opts.enabled as { value: boolean }).value
      : opts.enabled;
    expect(enabled).toBe(false);
  });

  it("is enabled when ticker has at least 4 characters", () => {
    const ticker = ref("MXRF");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    const enabled = typeof opts.enabled === "object" && opts.enabled !== null
      ? (opts.enabled as { value: boolean }).value
      : opts.enabled;
    expect(enabled).toBe(true);
  });

  it("is disabled for ticker with only whitespace", () => {
    const ticker = ref("    ");
    const client = buildMockClient(null);
    const opts = captureQueryOpts(ticker, client);

    const enabled = typeof opts.enabled === "object" && opts.enabled !== null
      ? (opts.enabled as { value: boolean }).value
      : opts.enabled;
    expect(enabled).toBe(false);
  });

  it("sets staleTime to 5 minutes", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    expect(opts.staleTime).toBe(5 * 60 * 1000);
  });

  it("sets retry to 1", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    expect(opts.retry).toBe(1);
  });

  it("calls client.getFiiQuote via queryFn with the ticker value", async () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    await opts.queryFn?.();

    expect(client.getFiiQuote).toHaveBeenCalledWith("MXRF11");
  });

  it("includes the ticker value in the query key", () => {
    const ticker = ref("KNRI11");
    const client = buildMockClient();
    const opts = captureQueryOpts(ticker, client);

    const key = typeof opts.queryKey === "object" && opts.queryKey !== null
      ? (opts.queryKey as { value: unknown[] }).value
      : opts.queryKey;
    expect(JSON.stringify(key)).toContain("KNRI11");
  });
});
