import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type {
  CreateCreditCardPayload,
  CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

/**
 * Vue Query mutation hook for creating a new credit card.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useCreateCreditCardMutation = (
  providedClient?: CreditCardsClient,
): UseMutationReturnType<CreditCardDto, ApiError, CreateCreditCardPayload, unknown> => {
  const client = providedClient ?? useCreditCardsClient();

  return createApiMutation(
    (payload: CreateCreditCardPayload): Promise<CreditCardDto> =>
      client.createCreditCard(payload),
    {
      successMessage: "Cartão criado.",
      invalidates: [["credit-cards", "list"]],
    },
  );
};
