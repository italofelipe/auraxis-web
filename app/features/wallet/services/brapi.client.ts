import axios from "axios";

/** Base URL for the BRAPI public financial data API. */
export const BRAPI_BASE_URL = "https://brapi.dev/api";

// ── Response shapes ──────────────────────────────────────────────────────────

/** A single ticker entry returned by BRAPI `/quote/list`. */
export type BrapiTickerSearchResult = {
  readonly stock: string;
  readonly name: string;
  readonly close: number | null;
  readonly change: number | null;
  readonly volume: number | null;
  readonly market_cap_basic: number | null;
  readonly logo: string | null;
  readonly sector: string | null;
};

/** Candlestick data point from BRAPI historical response. */
export type BrapiHistoricalDataPoint = {
  readonly date: number; // Unix timestamp in seconds
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly adjustedClose: number;
};

/** Full quote result from BRAPI `/quote/{ticker}`. */
export type BrapiQuoteApiResult = {
  readonly symbol: string;
  readonly shortName: string;
  readonly longName: string | null;
  readonly regularMarketPrice: number;
  readonly regularMarketChange: number;
  readonly regularMarketChangePercent: number;
  readonly currency: string;
  readonly historicalDataPrice: BrapiHistoricalDataPoint[];
};

// ── Domain types ─────────────────────────────────────────────────────────────

/** Resolved historical closing price for a specific date. */
export type BrapiHistoricalPrice = {
  readonly ticker: string;
  /**
   * The actual trading date for the returned price.
   * May differ from the requested date when the date falls on a weekend
   * or market holiday — BRAPI returns the closest prior trading day.
   */
  readonly date: string; // YYYY-MM-DD
  readonly price: number;
  readonly currency: string;
};

/** Resolved current market quote. */
export type BrapiCurrentQuote = {
  readonly ticker: string;
  readonly shortName: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly currency: string;
};

// ── Client ───────────────────────────────────────────────────────────────────

/**
 * BRAPI API client for ticker search, historical price, and current quote.
 *
 * Uses a dedicated Axios instance so it never shares auth headers or
 * interceptors with the Auraxis backend HTTP client.
 */
export class BrapiClient {
  readonly #apiKey: string;

  readonly #http = axios.create({
    baseURL: BRAPI_BASE_URL,
    timeout: 10_000,
  });

  /**
   * @param apiKey - BRAPI public API key from the runtime config.
   */
  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  /**
   * Searches for tickers matching the given query string.
   *
   * @param query - Partial ticker symbol or company name (case-insensitive).
   * @returns Up to 10 matching results ordered by relevance.
   */
  async searchTickers(query: string): Promise<BrapiTickerSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) { return []; }

    const response = await this.#http.get<{ stocks: BrapiTickerSearchResult[] }>("/quote/list", {
      params: { search: trimmed, token: this.#apiKey, limit: 10 },
    });

    return response.data.stocks ?? [];
  }

  /**
   * Fetches the closing price for a ticker on a specific date.
   *
   * If the requested date is a non-trading day (weekend / market holiday),
   * BRAPI returns the closest prior trading day's closing price.
   * The `date` field of the returned record reflects the actual trading date.
   *
   * @param ticker - Ticker symbol (e.g. "PETR4", "BTC").
   * @param date - Target date in "YYYY-MM-DD" format.
   * @returns Resolved historical price, or `null` if unavailable.
   */
  async getHistoricalPrice(ticker: string, date: string): Promise<BrapiHistoricalPrice | null> {
    const response = await this.#http.get<{ results: BrapiQuoteApiResult[] }>(
      `/quote/${ticker}`,
      {
        params: {
          range: "5d",
          interval: "1d",
          startDate: date,
          endDate: date,
          token: this.#apiKey,
        },
      },
    );

    const result = response.data.results?.[0];
    if (!result) { return null; }

    const point = result.historicalDataPrice?.[0];
    if (!point) { return null; }

    return {
      ticker: result.symbol ?? ticker,
      date: new Date(point.date * 1000).toISOString().slice(0, 10),
      price: point.close,
      currency: result.currency ?? "BRL",
    };
  }

  /**
   * Fetches the current (or last available) market quote for a ticker.
   *
   * @param ticker - Ticker symbol (e.g. "PETR4", "ITUB4").
   * @returns Current quote, or `null` if the ticker is not found.
   */
  async getCurrentQuote(ticker: string): Promise<BrapiCurrentQuote | null> {
    const response = await this.#http.get<{ results: BrapiQuoteApiResult[] }>(
      `/quote/${ticker}`,
      { params: { token: this.#apiKey, interval: "1d" } },
    );

    const result = response.data.results?.[0];
    if (!result) { return null; }

    return {
      ticker: result.symbol ?? ticker,
      shortName: result.shortName ?? result.longName ?? ticker,
      price: result.regularMarketPrice,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      currency: result.currency ?? "BRL",
    };
  }
}

/**
 * Resolves the canonical BRAPI client using the public API key
 * from Nuxt runtime config (`NUXT_PUBLIC_BRAPI_API_KEY`).
 *
 * Must be called within a Vue `setup` context so `useRuntimeConfig` is available.
 *
 * @returns Configured BrapiClient instance.
 */
export const useBrapiClient = (): BrapiClient => {
  const runtimeConfig = useRuntimeConfig();
  return new BrapiClient(String(runtimeConfig.public.brapiApiKey ?? ""));
};
