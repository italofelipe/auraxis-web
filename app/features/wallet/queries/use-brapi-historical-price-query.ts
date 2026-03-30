import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useBrapiClient,
  type BrapiClient,
  type BrapiHistoricalPrice,
} from "~/features/wallet/services/brapi.client";

/**
 * Vue Query hook that fetches the closing price for a ticker on a specific date.
 *
 * The query is only enabled when both `ticker` and `date` are non-empty.
 * Historical prices are immutable, so results are cached for 30 minutes.
 *
 * If the requested date falls on a weekend or market holiday, BRAPI returns
 * the closest prior trading day. The `date` field of the returned record
 * reflects the actual trading date used.
 *
 * @param ticker - Reactive ticker symbol (e.g. "PETR4", "BTC").
 * @param date - Reactive target date string in "YYYY-MM-DD" format.
 * @param providedClient - Optional injected BrapiClient for unit tests.
 * @returns Vue Query state with BrapiHistoricalPrice (or null if unavailable).
 */
export const useBrapiHistoricalPriceQuery = (
  ticker: Ref<string>,
  date: Ref<string>,
  providedClient?: BrapiClient,
): UseQueryReturnType<BrapiHistoricalPrice | null, Error> => {
  const client = providedClient ?? useBrapiClient();

  return useQuery({
    queryKey: computed(() => ["brapi", "historical", ticker.value, date.value] as const),
    queryFn: (): Promise<BrapiHistoricalPrice | null> =>
      client.getHistoricalPrice(ticker.value, date.value),
    enabled: computed(() => ticker.value.trim().length > 0 && date.value.length > 0),
    staleTime: 30 * 60 * 1000, // 30 minutes — historical prices never change
  });
};
