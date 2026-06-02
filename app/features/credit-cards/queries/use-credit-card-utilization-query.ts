import {
  type UseQueryReturnType,
  useQuery,
} from "@tanstack/vue-query";
import { type MaybeRefOrGetter, toValue } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import type { CreditCardUtilization } from "~/features/credit-cards/contracts/credit-card.dto";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

/**
 * Vue Query hook para a utilização (ciclo atual) de um cartão (cc-4 / #864).
 *
 * @param id Id do cartão (reativo).
 * @param providedClient Client opcional injetado para testes.
 * @returns Estado Vue Query com a utilização tipada.
 */
export const useCreditCardUtilizationQuery = (
  id: MaybeRefOrGetter<string>,
  providedClient?: CreditCardsClient,
): UseQueryReturnType<CreditCardUtilization, Error> => {
  const client = providedClient ?? useCreditCardsClient();

  return useQuery({
    queryKey: ["credit-cards", id, "utilization"] as const,
    queryFn: (): Promise<CreditCardUtilization> =>
      client.getUtilization(toValue(id)),
    staleTime: STALE_TIME.ACTIVE,
    enabled: (): boolean => Boolean(toValue(id)),
  });
};
