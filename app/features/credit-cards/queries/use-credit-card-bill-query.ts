import {
  type UseQueryReturnType,
  useQuery,
} from "@tanstack/vue-query";
import { type MaybeRefOrGetter, toValue } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import type { CreditCardBill } from "~/features/credit-cards/contracts/credit-card.dto";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

/**
 * Vue Query hook para a fatura de um cartão num mês (cc-4 / #864).
 *
 * @param id Id do cartão (reativo).
 * @param month Mês YYYY-MM (reativo); omitido = mês corrente no backend.
 * @param providedClient Client opcional injetado para testes.
 * @returns Estado Vue Query com a fatura tipada.
 */
export const useCreditCardBillQuery = (
  id: MaybeRefOrGetter<string>,
  month: MaybeRefOrGetter<string | undefined>,
  providedClient?: CreditCardsClient,
): UseQueryReturnType<CreditCardBill, Error> => {
  const client = providedClient ?? useCreditCardsClient();

  return useQuery({
    queryKey: ["credit-cards", id, "bill", month] as const,
    queryFn: (): Promise<CreditCardBill> =>
      client.getBill(toValue(id), toValue(month)),
    staleTime: STALE_TIME.ACTIVE,
    enabled: (): boolean => Boolean(toValue(id)),
  });
};
