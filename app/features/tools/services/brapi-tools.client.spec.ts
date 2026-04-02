import axios, { type AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BrapiToolsClient } from "./brapi-tools.client";

// ─── Mock axios ───────────────────────────────────────────────────────────────

vi.mock("axios");

const mockGet = vi.fn();
const mockAxiosCreate = vi.mocked(axios.create);

beforeEach(() => {
  mockGet.mockReset();
  mockAxiosCreate.mockReturnValue({ get: mockGet } as unknown as AxiosInstance);
});

// ─── getCurrencyQuotes ────────────────────────────────────────────────────────

describe("BrapiToolsClient.getCurrencyQuotes", () => {
  it("returns mapped currency array for valid pairs", async () => {
    const mockCurrency = [
      {
        fromCurrency: "USD",
        toCurrency: "BRL",
        name: "Dólar Americano/Real Brasileiro",
        high: 5.10,
        low: 4.95,
        bid: 5.00,
        ask: 5.05,
        pctChange: 0.5,
        description: "USD/BRL",
      },
    ];

    mockGet.mockResolvedValueOnce({ data: { currency: mockCurrency } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getCurrencyQuotes(["USD-BRL"]);

    expect(result).toHaveLength(1);
    expect(result[0]?.fromCurrency).toBe("USD");
    expect(result[0]?.toCurrency).toBe("BRL");
    expect(result[0]?.bid).toBe(5.00);
    expect(result[0]?.ask).toBe(5.05);
  });

  it("returns empty array when response currency field is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getCurrencyQuotes(["USD-BRL"]);

    expect(result).toEqual([]);
  });

  it("returns empty array when currency field is null", async () => {
    mockGet.mockResolvedValueOnce({ data: { currency: null } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getCurrencyQuotes(["USD-BRL"]);

    expect(result).toEqual([]);
  });

  it("passes all pairs joined by comma to the API", async () => {
    mockGet.mockResolvedValueOnce({ data: { currency: [] } });

    const client = new BrapiToolsClient("test-key");
    await client.getCurrencyQuotes(["USD-BRL", "EUR-BRL"]);

    expect(mockGet).toHaveBeenCalledWith("/v2/currency", {
      params: { currency: "USD-BRL,EUR-BRL", token: "test-key" },
    });
  });

  it("returns multiple currency results", async () => {
    const mockCurrency = [
      { fromCurrency: "USD", toCurrency: "BRL", name: "USD", high: 5.1, low: 4.9, bid: 5.0, ask: 5.05, pctChange: 0.3, description: "" },
      { fromCurrency: "EUR", toCurrency: "BRL", name: "EUR", high: 5.6, low: 5.4, bid: 5.5, ask: 5.55, pctChange: -0.2, description: "" },
    ];
    mockGet.mockResolvedValueOnce({ data: { currency: mockCurrency } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getCurrencyQuotes(["USD-BRL", "EUR-BRL"]);

    expect(result).toHaveLength(2);
    expect(result[1]?.fromCurrency).toBe("EUR");
  });
});

// ─── getFiiQuote ──────────────────────────────────────────────────────────────

describe("BrapiToolsClient.getFiiQuote", () => {
  it("returns mapped FII result with dividends", async () => {
    const mockResult = {
      symbol: "MXRF11",
      shortName: "MAXI RENDA",
      longName: null,
      regularMarketPrice: 10.50,
      regularMarketChangePercent: 0.2,
      currency: "BRL",
      dividendsData: {
        cashDividends: [
          { paymentDate: "2024-12-15", adjustedValue: 0.09, type: "Rendimento" },
          { paymentDate: "2024-11-15", adjustedValue: 0.09, type: "Rendimento" },
        ],
      },
    };
    mockGet.mockResolvedValueOnce({ data: { results: [mockResult] } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("MXRF11");

    expect(result).not.toBeNull();
    expect(result?.symbol).toBe("MXRF11");
    expect(result?.shortName).toBe("MAXI RENDA");
    expect(result?.regularMarketPrice).toBe(10.50);
    expect(result?.cashDividends).toHaveLength(2);
    expect(result?.cashDividends[0]?.adjustedValue).toBe(0.09);
  });

  it("returns null when results array is empty", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [] } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("INVALID11");

    expect(result).toBeNull();
  });

  it("returns null when results field is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("MXRF11");

    expect(result).toBeNull();
  });

  it("handles missing dividendsData gracefully with empty cashDividends", async () => {
    const mockResult = {
      symbol: "MXRF11",
      shortName: "MAXI RENDA",
      longName: null,
      regularMarketPrice: 10.50,
      regularMarketChangePercent: 0.2,
      currency: "BRL",
    };
    mockGet.mockResolvedValueOnce({ data: { results: [mockResult] } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("MXRF11");

    expect(result).not.toBeNull();
    expect(result?.cashDividends).toEqual([]);
  });

  it("handles missing cashDividends inside dividendsData gracefully", async () => {
    const mockResult = {
      symbol: "MXRF11",
      shortName: "MAXI RENDA",
      longName: null,
      regularMarketPrice: 10.50,
      regularMarketChangePercent: 0.2,
      currency: "BRL",
      dividendsData: {},
    };
    mockGet.mockResolvedValueOnce({ data: { results: [mockResult] } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("MXRF11");

    expect(result?.cashDividends).toEqual([]);
  });

  it("falls back to ticker symbol when shortName and longName are absent", async () => {
    const mockResult = {
      symbol: "MXRF11",
      shortName: "",
      longName: null,
      regularMarketPrice: 10.50,
      regularMarketChangePercent: 0.2,
      currency: "BRL",
      dividendsData: { cashDividends: [] },
    };
    mockGet.mockResolvedValueOnce({ data: { results: [mockResult] } });

    const client = new BrapiToolsClient("test-key");
    const result = await client.getFiiQuote("MXRF11");

    // shortName is empty string — falsy, so should fall back to longName, then ticker
    expect(result?.symbol).toBe("MXRF11");
  });
});
