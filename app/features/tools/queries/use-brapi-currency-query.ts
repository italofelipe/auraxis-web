import { type Ref, computed } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useBrapiToolsClient,
  type BrapiToolsClient,
  type BrapiCurrencyResult,
} from "~/features/tools/services/brapi-tools.client";

/**
 * Fetches current exchange rates for given currency pairs from BRAPI.
 * Refreshes every 5 minutes. Enabled only when pairs array is non-empty.
 *
 * @param pairs - Reactive array of currency pair strings, e.g. ["USD-BRL"].
 * @param providedClient - Optional injected client for unit tests.
 * @returns Vue Query state with BrapiCurrencyResult array.
 */
export const useBrapiCurrencyQuery = (
  pairs: Ref<string[]>,
  providedClient?: BrapiToolsClient,
): UseQueryReturnType<BrapiCurrencyResult[], Error> => {
  const client = providedClient ?? useBrapiToolsClient();
  return useQuery({
    queryKey: computed(() => ["brapi", "currency", pairs.value] as const),
    queryFn: (): Promise<BrapiCurrencyResult[]> => client.getCurrencyQuotes(pairs.value),
    enabled: computed(() => pairs.value.length > 0),
    staleTime: STALE_TIME.STABLE,
    retry: 1,
  });
};
