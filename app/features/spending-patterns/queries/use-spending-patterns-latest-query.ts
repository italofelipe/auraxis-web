import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { type MaybeRefOrGetter, toValue } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useSpendingPatternsApiClient,
  type SpendingPatternsApiClient,
} from "~/features/spending-patterns/services/spending-patterns.client";
import type { SpendingPatternsLatest } from "~/features/spending-patterns/model/spending-patterns";

interface UseSpendingPatternsLatestQueryOptions {
  /** Gate on premium entitlement so free users never hit the backend. */
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Vue Query hook that reads the latest cron-generated spending-patterns radar.
 *
 * This is the read-only counterpart to the (now cron-only) generation path: it
 * GETs `/ai/insights/spending-patterns/latest`, which never calls the LLM and
 * never consumes the AI daily quota. The dashboard uses this so logging in no
 * longer burns the user's 1/day insight quota.
 *
 * @param options Query controls (enabled).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with the cached radar (patterns + generatedAt).
 */
export const useSpendingPatternsLatestQuery = (
  options: UseSpendingPatternsLatestQueryOptions = {},
  providedClient?: SpendingPatternsApiClient,
): UseQueryReturnType<SpendingPatternsLatest, Error> => {
  const client = providedClient ?? useSpendingPatternsApiClient();

  return useQuery({
    queryKey: ["spending-patterns", "latest"] as const,
    queryFn: (): Promise<SpendingPatternsLatest> => client.getLatest(),
    enabled: (): boolean => toValue(options.enabled ?? true),
    staleTime: STALE_TIME.STATIC,
  });
};
