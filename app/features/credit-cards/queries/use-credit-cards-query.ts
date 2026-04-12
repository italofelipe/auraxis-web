import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { MOCK_CREDIT_CARDS } from "~/features/credit-cards/mock/credit-cards.mock";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

/**
 * Vue Query hook for listing the authenticated user's credit cards.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed CreditCardDto array.
 */
export const useCreditCardsQuery = (
  providedClient?: CreditCardsClient,
): UseQueryReturnType<CreditCardDto[], Error> => {
  const client = providedClient ?? useCreditCardsClient();

  return useQuery({
    queryKey: ["credit-cards", "list"] as const,
    queryFn: (): Promise<CreditCardDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_CREDIT_CARDS);
      }
      return client.listCreditCards();
    },
    staleTime: STALE_TIME.STATIC,
  });
};
