import { beforeEach, describe, expect, it, vi } from "vitest";

import axios from "axios";

import {
  BrapiClient,
  BRAPI_BASE_URL,
  type BrapiTickerSearchResult,
  type BrapiQuoteApiResult,
} from "./brapi.client";

vi.mock("axios");

// vi.mocked preserves the mocked function type for direct function calls, but
// `axios.create` is a method on a namespace object. Casting as unknown first
// avoids the TypeScript error while keeping the runtime mock intact.
const mockedAxiosCreate = vi.mocked(axios.create) as ReturnType<typeof vi.fn>;

/**
 * Minimal BrapiTickerSearchResult fixture.
 *
 * @returns BrapiTickerSearchResult with PETR4 data.
 */
const makeTicker = (): BrapiTickerSearchResult => ({
  stock: "PETR4",
  name: "Petrobras PN",
  close: 38.5,
  change: 0.5,
  volume: 10_000_000,
  market_cap_basic: 500_000_000,
  logo: null,
  sector: "Energia",
});

/**
 * Minimal BrapiQuoteApiResult fixture with historical data.
 *
 * @param overrides - Partial overrides applied to the default fixture.
 * @returns BrapiQuoteApiResult fixture for PETR4.
 */
const makeQuoteResult = (overrides: Partial<BrapiQuoteApiResult> = {}): BrapiQuoteApiResult => ({
  symbol: "PETR4",
  shortName: "Petrobras PN",
  longName: "Petróleo Brasileiro S.A. - Petrobras",
  regularMarketPrice: 38.5,
  regularMarketChange: 0.5,
  regularMarketChangePercent: 1.32,
  currency: "BRL",
  historicalDataPrice: [
    {
      date: 1623542400, // 2021-06-13 in Unix seconds (UTC)
      open: 28.0,
      high: 29.0,
      low: 27.5,
      close: 28.5,
      volume: 8_000_000,
      adjustedClose: 28.5,
    },
  ],
  ...overrides,
});

describe("BrapiClient", () => {
  let httpGetMock: ReturnType<typeof vi.fn>;
  let client: BrapiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    httpGetMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({ get: httpGetMock } as never);
    client = new BrapiClient("test-api-key");
  });

  it("creates an axios instance with the correct baseURL and timeout", () => {
    expect(mockedAxiosCreate).toHaveBeenCalledWith({
      baseURL: BRAPI_BASE_URL,
      timeout: 10_000,
    });
  });

  // ── searchTickers ─────────────────────────────────────────────────────────

  describe("searchTickers", () => {
    it("returns an empty array for empty / whitespace-only queries", async () => {
      const result = await client.searchTickers("   ");
      expect(result).toEqual([]);
      expect(httpGetMock).not.toHaveBeenCalled();
    });

    it("calls /quote/list with the trimmed search term, token, and limit 10", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { stocks: [makeTicker()] } });

      await client.searchTickers("  PETR  ");

      expect(httpGetMock).toHaveBeenCalledWith("/quote/list", {
        params: { search: "PETR", token: "test-api-key", limit: 10 },
      });
    });

    it("returns the stocks array from the response", async () => {
      const ticker = makeTicker();
      httpGetMock.mockResolvedValueOnce({ data: { stocks: [ticker] } });

      const result = await client.searchTickers("PETR");

      expect(result).toEqual([ticker]);
    });

    it("returns an empty array when stocks is absent from the response", async () => {
      httpGetMock.mockResolvedValueOnce({ data: {} });

      const result = await client.searchTickers("PETR");

      expect(result).toEqual([]);
    });

    it("propagates network errors without catching them", async () => {
      httpGetMock.mockRejectedValueOnce(new Error("network error"));

      await expect(client.searchTickers("PETR")).rejects.toThrow("network error");
    });
  });

  // ── getHistoricalPrice ────────────────────────────────────────────────────

  describe("getHistoricalPrice", () => {
    it("calls /quote/{ticker} with correct range, interval, startDate, endDate, and token", async () => {
      const quoteResult = makeQuoteResult();
      httpGetMock.mockResolvedValueOnce({ data: { results: [quoteResult] } });

      await client.getHistoricalPrice("PETR4", "2021-06-13");

      expect(httpGetMock).toHaveBeenCalledWith("/quote/PETR4", {
        params: {
          range: "5d",
          interval: "1d",
          startDate: "2021-06-13",
          endDate: "2021-06-13",
          token: "test-api-key",
        },
      });
    });

    it("returns a BrapiHistoricalPrice with the correct fields", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { results: [makeQuoteResult()] } });

      const result = await client.getHistoricalPrice("PETR4", "2021-06-13");

      expect(result).not.toBeNull();
      expect(result?.ticker).toBe("PETR4");
      expect(result?.price).toBe(28.5);
      expect(result?.currency).toBe("BRL");
      // Date is derived from Unix timestamp 1623542400 → 2021-06-13
      expect(result?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns null when results array is empty", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { results: [] } });

      const result = await client.getHistoricalPrice("PETR4", "2021-06-13");

      expect(result).toBeNull();
    });

    it("returns null when historicalDataPrice is empty", async () => {
      httpGetMock.mockResolvedValueOnce({
        data: { results: [makeQuoteResult({ historicalDataPrice: [] })] },
      });

      const result = await client.getHistoricalPrice("PETR4", "2021-06-13");

      expect(result).toBeNull();
    });

    it("propagates network errors without catching them", async () => {
      httpGetMock.mockRejectedValueOnce(new Error("timeout"));

      await expect(client.getHistoricalPrice("PETR4", "2021-06-13")).rejects.toThrow("timeout");
    });
  });

  // ── getCurrentQuote ───────────────────────────────────────────────────────

  describe("getCurrentQuote", () => {
    it("calls /quote/{ticker} with token and interval", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { results: [makeQuoteResult()] } });

      await client.getCurrentQuote("PETR4");

      expect(httpGetMock).toHaveBeenCalledWith("/quote/PETR4", {
        params: { token: "test-api-key", interval: "1d" },
      });
    });

    it("returns a BrapiCurrentQuote with correct fields", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { results: [makeQuoteResult()] } });

      const result = await client.getCurrentQuote("PETR4");

      expect(result).not.toBeNull();
      expect(result?.ticker).toBe("PETR4");
      expect(result?.price).toBe(38.5);
      expect(result?.change).toBe(0.5);
      expect(result?.changePercent).toBe(1.32);
      expect(result?.currency).toBe("BRL");
    });

    it("falls back to longName when shortName is null", async () => {
      httpGetMock.mockResolvedValueOnce({
        data: {
          results: [
            // shortName is typed as string but the API can return null at runtime.
            makeQuoteResult({ shortName: null as unknown as string, longName: "Long Name Fallback" }),
          ],
        },
      });

      const result = await client.getCurrentQuote("PETR4");

      expect(result?.shortName).toBe("Long Name Fallback");
    });

    it("returns null when results array is empty", async () => {
      httpGetMock.mockResolvedValueOnce({ data: { results: [] } });

      const result = await client.getCurrentQuote("PETR4");

      expect(result).toBeNull();
    });

    it("propagates network errors without catching them", async () => {
      httpGetMock.mockRejectedValueOnce(new Error("network error"));

      await expect(client.getCurrentQuote("PETR4")).rejects.toThrow("network error");
    });
  });
});
