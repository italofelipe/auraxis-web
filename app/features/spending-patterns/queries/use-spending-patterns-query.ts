import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { type MaybeRefOrGetter, computed, toValue } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import type { SpendingPatternTransactionInputDto } from "~/features/spending-patterns/contracts/spending-patterns.dto";
import {
  useSpendingPatternsApiClient,
  type SpendingPatternsApiClient,
} from "~/features/spending-patterns/services/spending-patterns.client";
import type { SpendingPattern } from "~/features/spending-patterns/model/spending-patterns";

interface UseSpendingPatternsQueryOptions {
  /** Gate on premium entitlement so free users never hit the backend. */
  enabled?: MaybeRefOrGetter<boolean>;
  periodDays?: number;
}

/**
 * Vue Query hook for the spending-patterns radar.
 *
 * The query is keyed by a lightweight signature (transaction count + window) so
 * it does not refetch on every render, and only runs when enabled and there is
 * at least one transaction to analyse.
 *
 * @param transactions Reactive LGPD-safe transaction inputs.
 * @param options Query controls (enabled, periodDays).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with severity-ordered patterns.
 */
export const useSpendingPatternsQuery = (
  transactions: MaybeRefOrGetter<readonly SpendingPatternTransactionInputDto[]>,
  options: UseSpendingPatternsQueryOptions = {},
  providedClient?: SpendingPatternsApiClient,
): UseQueryReturnType<SpendingPattern[], Error> => {
  const client = providedClient ?? useSpendingPatternsApiClient();
  const periodDays = options.periodDays ?? 90;

  const list = computed(() => toValue(transactions));

  return useQuery({
    queryKey: ["spending-patterns", computed(() => list.value.length), periodDays] as const,
    queryFn: (): Promise<SpendingPattern[]> => client.detect(list.value, periodDays),
    enabled: (): boolean => toValue(options.enabled ?? true) && list.value.length > 0,
    staleTime: STALE_TIME.STATIC,
    retry: false,
  });
};
