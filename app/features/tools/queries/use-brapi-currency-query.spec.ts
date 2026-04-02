import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/vue-query";

import { useBrapiCurrencyQuery } from "./use-brapi-currency-query";
import type { BrapiCurrencyResult, BrapiToolsClient } from "~/features/tools/services/brapi-tools.client";

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
  mockUseQuery.mockReset();
  mockUseQuery.mockReturnValue({
    data: ref(mockCurrencyData),
    isLoading: ref(false),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  } as ReturnType<typeof useQuery>);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useBrapiCurrencyQuery", () => {
  it("calls useQuery once when hook is invoked", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();
    useBrapiCurrencyQuery(pairs, client);

    expect(mockUseQuery).toHaveBeenCalledOnce();
  });

  it("returns data from useQuery", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();
    const result = useBrapiCurrencyQuery(pairs, client);

    expect(result.data.value).toEqual(mockCurrencyData);
  });

  it("is disabled when pairs array is empty", () => {
    const pairs = ref<string[]>([]);
    const client = buildMockClient([]);

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(undefined),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    const enabled = typeof capturedOpts.enabled === "object" && capturedOpts.enabled !== null
      ? (capturedOpts.enabled as { value: boolean }).value
      : capturedOpts.enabled;
    expect(enabled).toBe(false);
  });

  it("is enabled when pairs has at least one entry", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(mockCurrencyData),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    const enabled = typeof capturedOpts.enabled === "object" && capturedOpts.enabled !== null
      ? (capturedOpts.enabled as { value: boolean }).value
      : capturedOpts.enabled;
    expect(enabled).toBe(true);
  });

  it("sets staleTime to 5 minutes", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(mockCurrencyData),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    expect(capturedOpts.staleTime).toBe(5 * 60 * 1000);
  });

  it("sets retry to 1", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(mockCurrencyData),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    expect(capturedOpts.retry).toBe(1);
  });

  it("calls client.getCurrencyQuotes via queryFn", async () => {
    const pairs = ref(["USD-BRL", "EUR-BRL"]);
    const client = buildMockClient();

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(mockCurrencyData),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    await capturedOpts.queryFn?.();

    expect(client.getCurrencyQuotes).toHaveBeenCalledWith(["USD-BRL", "EUR-BRL"]);
  });

  it("returns isError false on successful query", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();
    const result = useBrapiCurrencyQuery(pairs, client);

    expect(result.isError.value).toBe(false);
  });

  it("includes the pairs in the query key", () => {
    const pairs = ref(["USD-BRL"]);
    const client = buildMockClient();

    let capturedOpts: CapturedOptions = {};
    mockUseQuery.mockImplementation((opts: CapturedOptions) => {
      capturedOpts = opts;
      return {
        data: ref(mockCurrencyData),
        isLoading: ref(false),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as ReturnType<typeof useQuery>;
    });

    useBrapiCurrencyQuery(pairs, client);

    const key = typeof capturedOpts.queryKey === "object" && capturedOpts.queryKey !== null
      ? (capturedOpts.queryKey as { value: unknown[] }).value
      : capturedOpts.queryKey;
    expect(JSON.stringify(key)).toContain("USD-BRL");
  });
});
