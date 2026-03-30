import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useBrapiClient,
  type BrapiClient,
  type BrapiCurrentQuote,
} from "~/features/wallet/services/brapi.client";

/**
 * Vue Query hook that fetches the current (or last available) market quote for a ticker.
 *
 * The query is only enabled when `ticker` is non-empty.
 * Results are refreshed every 1 minute — market prices change frequently during trading hours.
 *
 * @param ticker - Reactive ticker symbol (e.g. "PETR4", "ITUB4").
 * @param providedClient - Optional injected BrapiClient for unit tests.
 * @returns Vue Query state with BrapiCurrentQuote (or null if ticker not found).
 */
export const useBrapiCurrentQuoteQuery = (
  ticker: Ref<string>,
  providedClient?: BrapiClient,
): UseQueryReturnType<BrapiCurrentQuote | null, Error> => {
  const client = providedClient ?? useBrapiClient();

  return useQuery({
    queryKey: computed(() => ["brapi", "quote", "current", ticker.value] as const),
    queryFn: (): Promise<BrapiCurrentQuote | null> => client.getCurrentQuote(ticker.value),
    enabled: computed(() => ticker.value.trim().length > 0),
    staleTime: 60 * 1000, // 1 minute — current prices change during trading hours
  });
};
