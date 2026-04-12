import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useBrapiToolsClient,
  type BrapiToolsClient,
  type BrapiFiiQuoteResult,
} from "~/features/tools/services/brapi-tools.client";

/**
 * Fetches current FII quote with dividend data from BRAPI.
 * Enabled only when ticker is non-empty (≥ 4 chars for valid FII codes).
 * Refreshes every 5 minutes.
 *
 * @param ticker - Reactive FII ticker symbol (e.g. "MXRF11").
 * @param providedClient - Optional injected client for unit tests.
 * @returns Vue Query state with BrapiFiiQuoteResult (or null if ticker not found).
 */
export const useBrapiFiiQuoteQuery = (
  ticker: Ref<string>,
  providedClient?: BrapiToolsClient,
): UseQueryReturnType<BrapiFiiQuoteResult | null, Error> => {
  const client = providedClient ?? useBrapiToolsClient();
  return useQuery({
    queryKey: computed(() => ["brapi", "fii", ticker.value] as const),
    queryFn: (): Promise<BrapiFiiQuoteResult | null> => client.getFiiQuote(ticker.value),
    enabled: computed(() => ticker.value.trim().length >= 4),
    staleTime: STALE_TIME.STABLE,
    retry: 1,
  });
};
