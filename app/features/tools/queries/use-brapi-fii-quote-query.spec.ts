import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useBrapiFiiQuoteQuery } from "./use-brapi-fii-quote-query";
import type { BrapiFiiQuoteResult, BrapiToolsClient } from "~/features/tools/services/brapi-tools.client";

// ─── Mock @tanstack/vue-query ─────────────────────────────────────────────────

vi.mock("@tanstack/vue-query", async () => {
  const actual = await vi.importActual("@tanstack/vue-query");
  return {
    ...actual,
    useQuery: vi.fn((opts: unknown) => opts),
  };
});

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useBrapiFiiQuoteQuery", () => {
  it("passes enabled=true when ticker has at least 4 characters", () => {
    const ticker = ref("MXRF");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(true);
  });

  it("passes enabled=false when ticker is empty string", () => {
    const ticker = ref("");
    const client = buildMockClient(null);

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(false);
  });

  it("passes enabled=false when ticker has fewer than 4 characters", () => {
    const ticker = ref("MXR");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(false);
  });

  it("passes enabled=false for ticker with only whitespace", () => {
    const ticker = ref("    ");
    const client = buildMockClient(null);

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(false);
  });

  it("sets staleTime to 5 minutes", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    expect(result["staleTime"]).toBe(5 * 60 * 1000);
  });

  it("sets retry to 1", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    expect(result["retry"]).toBe(1);
  });

  it("queryFn calls client.getFiiQuote with the ticker value", async () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const queryFn = result["queryFn"] as () => Promise<BrapiFiiQuoteResult | null>;
    await queryFn();

    expect(client.getFiiQuote).toHaveBeenCalledWith("MXRF11");
  });

  it("queryFn returns data from the client", async () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient(mockFiiData);

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const queryFn = result["queryFn"] as () => Promise<BrapiFiiQuoteResult | null>;
    const data = await queryFn();

    expect(data).toEqual(mockFiiData);
  });

  it("includes the ticker value in the query key", () => {
    const ticker = ref("KNRI11");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const key = result["queryKey"];
    const keyValue = typeof key === "object" && key !== null && "value" in (key as object)
      ? (key as { value: unknown[] }).value
      : key;
    expect(JSON.stringify(keyValue)).toContain("KNRI11");
  });

  it("includes brapi and fii in the query key", () => {
    const ticker = ref("MXRF11");
    const client = buildMockClient();

    const result = useBrapiFiiQuoteQuery(ticker, client) as unknown as Record<string, unknown>;
    const key = result["queryKey"];
    const keyValue = typeof key === "object" && key !== null && "value" in (key as object)
      ? (key as { value: unknown[] }).value
      : key;
    expect(JSON.stringify(keyValue)).toContain("brapi");
    expect(JSON.stringify(keyValue)).toContain("fii");
  });
});
