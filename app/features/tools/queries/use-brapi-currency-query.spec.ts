import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useBrapiCurrencyQuery } from "./use-brapi-currency-query";
import type { BrapiCurrencyResult, BrapiToolsClient } from "~/features/tools/services/brapi-tools.client";

// ─── Mock @tanstack/vue-query ─────────────────────────────────────────────────

vi.mock("@tanstack/vue-query", async () => {
  const actual = await vi.importActual("@tanstack/vue-query");
  return {
    ...actual,
    useQuery: vi.fn((opts: unknown) => opts),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockCurrencyData: BrapiCurrencyResult[] = [
  {
    fromCurrency: "USD",
    toCurrency: "BRL",
    name: "Dólar",
    high: 5.10,
    low: 4.90,
    bid: 5.00,
    ask: 5.05,
    pctChange: 0.5,
    description: "USD/BRL",
  },
];

/**
 * Builds a minimal mock BrapiToolsClient for tests.
 *
 * @param data - Currency data to return from getCurrencyQuotes.
 * @returns Mock BrapiToolsClient.
 */
function buildMockClient(data: BrapiCurrencyResult[] = mockCurrencyData): BrapiToolsClient {
  return {
    getCurrencyQuotes: vi.fn().mockResolvedValue(data),
    getFiiQuote: vi.fn(),
  } as unknown as BrapiToolsClient;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useBrapiCurrencyQuery", () => {
  it("passes enabled=true when pairs is non-empty", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(true);
  });

  it("passes enabled=false when pairs is empty", () => {
    const pairs = ref<string[]>([]);
    const client = buildMockClient([]);

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const enabled = result["enabled"];
    const value = typeof enabled === "object" && enabled !== null
      ? (enabled as { value: boolean }).value
      : enabled;
    expect(value).toBe(false);
  });

  it("sets staleTime to 5 minutes", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    expect(result["staleTime"]).toBe(5 * 60 * 1000);
  });

  it("sets retry to 1", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    expect(result["retry"]).toBe(1);
  });

  it("includes brapi and currency in the query key", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const key = result["queryKey"];
    const keyValue = typeof key === "object" && key !== null && "value" in (key as object)
      ? (key as { value: unknown[] }).value
      : key;
    expect(JSON.stringify(keyValue)).toContain("brapi");
    expect(JSON.stringify(keyValue)).toContain("currency");
  });

  it("queryFn calls client.getCurrencyQuotes with pairs", async () => {
    const pairs = ref(["USD-BRL", "EUR-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const queryFn = result["queryFn"] as () => Promise<BrapiCurrencyResult[]>;
    await queryFn();

    expect(client.getCurrencyQuotes).toHaveBeenCalledWith(["USD-BRL", "EUR-BRL"]);
  });

  it("queryFn returns data from the client", async () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient(mockCurrencyData);

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const queryFn = result["queryFn"] as () => Promise<BrapiCurrencyResult[]>;
    const data = await queryFn();

    expect(data).toEqual(mockCurrencyData);
  });

  it("includes the pair values in the query key", () => {
    const pairs = ref(["EUR-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const key = result["queryKey"];
    const keyValue = typeof key === "object" && key !== null && "value" in (key as object)
      ? (key as { value: unknown[] }).value
      : key;
    expect(JSON.stringify(keyValue)).toContain("EUR-BRL");
  });

  it("passes pairs correctly to client when multiple pairs provided", async () => {
    const pairs = ref(["USD-BRL", "BTC-BRL"]);
    const client = buildMockClient();

    const result = useBrapiCurrencyQuery(pairs, client) as unknown as Record<string, unknown>;
    const queryFn = result["queryFn"] as () => Promise<BrapiCurrencyResult[]>;
    await queryFn();

    expect(client.getCurrencyQuotes).toHaveBeenCalledWith(["USD-BRL", "BTC-BRL"]);
  });
});
