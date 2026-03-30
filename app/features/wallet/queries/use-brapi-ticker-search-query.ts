import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useBrapiClient,
  type BrapiClient,
  type BrapiTickerSearchResult,
} from "~/features/wallet/services/brapi.client";

/**
 * Vue Query hook that searches BRAPI for tickers matching the given query string.
 *
 * The query is only enabled when `query` has at least one non-whitespace character.
 * Results are cached for 5 minutes — ticker metadata is stable within a session.
 *
 * @param query - Reactive search term (partial ticker symbol or company name).
 * @param providedClient - Optional injected BrapiClient for unit tests.
 * @returns Vue Query state with matching BrapiTickerSearchResult array.
 */
export const useBrapiTickerSearchQuery = (
  query: Ref<string>,
  providedClient?: BrapiClient,
): UseQueryReturnType<BrapiTickerSearchResult[], Error> => {
  const client = providedClient ?? useBrapiClient();

  return useQuery({
    queryKey: computed(() => ["brapi", "tickers", "search", query.value] as const),
    queryFn: (): Promise<BrapiTickerSearchResult[]> => client.searchTickers(query.value),
    enabled: computed(() => query.value.trim().length >= 1),
    staleTime: 5 * 60 * 1000, // 5 minutes — ticker metadata is stable within a session
  });
};
