import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

/**
 * Vue Query mutation hook for deleting a credit card.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteCreditCardMutation = (
  providedClient?: CreditCardsClient,
): UseMutationReturnType<void, ApiError, string, unknown> => {
  const client = providedClient ?? useCreditCardsClient();

  return createApiMutation(
    (id: string): Promise<void> => client.deleteCreditCard(id),
    {
      successMessage: "Cartão removido.",
      invalidates: [["credit-cards", "list"]],
    },
  );
};
