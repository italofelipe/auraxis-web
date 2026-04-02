/**
 * BRAPI tools client — currency and FII dividend data.
 *
 * Separate from the wallet BrapiClient to avoid coupling tool pages
 * to the wallet feature. Uses the same API key from runtime config.
 */
import axios from "axios";

/** BRAPI v2 currency quote response shape. */
export type BrapiCurrencyResult = {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly name: string;
  readonly high: number;
  readonly low: number;
  readonly bid: number;    // "compra"
  readonly ask: number;    // "venda"
  readonly pctChange: number;
  readonly description: string;
};

/** Single dividend entry from BRAPI fundamental data. */
export type BrapiDividendEntry = {
  readonly paymentDate: string;      // "YYYY-MM-DD"
  readonly adjustedValue: number;    // dividend per unit in BRL
  readonly type: string;             // "JCP", "Rendimento", etc.
};

/** FII/stock quote with dividend data from BRAPI. */
export type BrapiFiiQuoteResult = {
  readonly symbol: string;
  readonly shortName: string;
  readonly regularMarketPrice: number;
  readonly regularMarketChangePercent: number;
  readonly currency: string;
  readonly cashDividends: BrapiDividendEntry[];
};

/**
 * BRAPI API client for currency exchange rates and FII dividend data.
 *
 * Uses a dedicated Axios instance so it never shares auth headers or
 * interceptors with the Auraxis backend HTTP client.
 */
export class BrapiToolsClient {
  readonly #apiKey: string;
  readonly #http = axios.create({ baseURL: "https://brapi.dev/api", timeout: 10_000 });

  /**
   * @param apiKey - BRAPI public API key from runtime config.
   */
  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  /**
   * Fetches current exchange rates for currency pairs (e.g. "USD-BRL").
   * Uses BRAPI v2 currency endpoint.
   *
   * @param pairs - Array of currency pair strings, e.g. ["USD-BRL", "EUR-BRL"].
   * @returns Array of currency quote results.
   */
  async getCurrencyQuotes(pairs: string[]): Promise<BrapiCurrencyResult[]> {
    const response = await this.#http.get<{ currency: BrapiCurrencyResult[] }>("/v2/currency", {
      params: { currency: pairs.join(","), token: this.#apiKey },
    });
    return response.data.currency ?? [];
  }

  /**
   * Fetches current quote and last 12 months of dividends for a FII/stock ticker.
   * Uses `?fundamental=true` to include dividends data.
   *
   * @param ticker - FII or stock ticker symbol (e.g. "MXRF11").
   * @returns Quote with dividend history, or null if ticker not found.
   */
  async getFiiQuote(ticker: string): Promise<BrapiFiiQuoteResult | null> {
    const response = await this.#http.get<{
      results: Array<{
        symbol: string;
        shortName: string;
        longName: string | null;
        regularMarketPrice: number;
        regularMarketChangePercent: number;
        currency: string;
        dividendsData?: { cashDividends?: BrapiDividendEntry[] };
      }>;
    }>(`/quote/${ticker}`, {
      params: { token: this.#apiKey, fundamental: "true", interval: "1d" },
    });

    const r = response.data.results?.[0];
    if (!r) { return null; }

    return {
      symbol: r.symbol ?? ticker,
      shortName: r.shortName ?? r.longName ?? ticker,
      regularMarketPrice: r.regularMarketPrice,
      regularMarketChangePercent: r.regularMarketChangePercent,
      currency: r.currency ?? "BRL",
      cashDividends: r.dividendsData?.cashDividends ?? [],
    };
  }
}

/**
 * Resolves BrapiToolsClient using NUXT_PUBLIC_BRAPI_API_KEY from runtime config.
 * Must be called inside a Vue setup context.
 *
 * @returns Configured BrapiToolsClient instance.
 */
export const useBrapiToolsClient = (): BrapiToolsClient => {
  const runtimeConfig = useRuntimeConfig();
  return new BrapiToolsClient(String(runtimeConfig.public.brapiApiKey ?? ""));
};
