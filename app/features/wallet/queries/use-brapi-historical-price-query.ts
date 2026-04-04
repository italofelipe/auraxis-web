import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { useRuntimeConfig } from "#app";

import {
  useBrapiClient,
  type BrapiClient,
  type BrapiHistoricalPrice,
} from "~/features/wallet/services/brapi.client";

/** Minimal structural interface for the BRAPI historical price client — used for test injection. */
export interface BrapiHistoricalPriceClientLike {
  /**
   * Fetches the closing price for a ticker on a specific date.
   *
   * @param ticker - Ticker symbol (e.g. "PETR4", "BTC").
   * @param date - Target date in "YYYY-MM-DD" format.
   * @returns Resolved historical price, or null if unavailable.
   */
  getHistoricalPrice(ticker: string, date: string): Promise<BrapiHistoricalPrice | null>;
}

/**
 * Optional dependency overrides for unit tests.
 * Pass either a bare BrapiClient (legacy) or this object.
 */
export interface BrapiHistoricalPriceQueryDeps {
  /** Optional injected client for unit tests. */
  client?: BrapiHistoricalPriceClientLike;
  /**
   * Optional BRAPI API key override for unit tests.
   * Pass an empty string to simulate a missing key.
   * When omitted the value is read from `runtimeConfig.public.brapiApiKey`.
   */
  brapiApiKey?: string;
}

/**
 * Vue Query hook that fetches the closing price for a ticker on a specific date.
 *
 * The query is only enabled when both `ticker` and `date` are non-empty AND the
 * BRAPI API key is configured (`NUXT_PUBLIC_BRAPI_API_KEY`). When the key is
 * absent the query stays disabled so the form falls back to manual price entry.
 *
 * Historical prices are immutable, so results are cached for 30 minutes.
 *
 * If the requested date falls on a weekend or market holiday, BRAPI returns
 * the closest prior trading day. The `date` field of the returned record
 * reflects the actual trading date used.
 *
 * @param ticker - Reactive ticker symbol (e.g. "PETR4", "BTC").
 * @param date - Reactive target date string in "YYYY-MM-DD" format.
 * @param deps - Optional BrapiClient or BrapiHistoricalPriceQueryDeps for unit tests.
 * @returns Vue Query state with BrapiHistoricalPrice (or null if unavailable).
 */
export const useBrapiHistoricalPriceQuery = (
  ticker: Ref<string>,
  date: Ref<string>,
  deps?: BrapiHistoricalPriceQueryDeps | BrapiClient,
): UseQueryReturnType<BrapiHistoricalPrice | null, Error> => {
  /**
   * Returns true when the value is a raw BrapiClient instance (legacy argument form).
   *
   * @param v - Unknown value to check.
   * @returns True when the value duck-types as a BrapiClient.
   */
  const isBrapiClientInstance = (v: unknown): v is BrapiClient =>
    v !== null && typeof v === "object" && "getHistoricalPrice" in (v as object);

  const resolvedClient: BrapiHistoricalPriceClientLike | undefined = isBrapiClientInstance(deps)
    ? deps
    : (deps as BrapiHistoricalPriceQueryDeps | undefined)?.client;

  const overrideApiKey: string | undefined = isBrapiClientInstance(deps)
    ? undefined
    : (deps as BrapiHistoricalPriceQueryDeps | undefined)?.brapiApiKey;

  // Only call useRuntimeConfig when not overridden by test deps (avoids Nuxt context in tests)
  const apiKey: string = overrideApiKey !== undefined
    ? overrideApiKey
    : String(useRuntimeConfig().public.brapiApiKey ?? "");

  const client: BrapiHistoricalPriceClientLike = resolvedClient ?? useBrapiClient();

  return useQuery({
    queryKey: computed(() => ["brapi", "historical", ticker.value, date.value] as const),
    queryFn: (): Promise<BrapiHistoricalPrice | null> =>
      client.getHistoricalPrice(ticker.value, date.value),
    enabled: computed(
      () =>
        ticker.value.trim().length > 0 &&
        date.value.length > 0 &&
        apiKey.length > 0,
    ),
    staleTime: 30 * 60 * 1000, // 30 minutes — historical prices never change
  });
};
