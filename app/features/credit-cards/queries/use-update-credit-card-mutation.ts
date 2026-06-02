import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type {
  CreditCardDto,
  CreateCreditCardPayload,
} from "~/features/credit-cards/contracts/credit-card.dto";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

export type UpdateCreditCardVariables = {
  readonly id: string;
} & CreateCreditCardPayload;

/**
 * Vue Query mutation hook for updating a credit card.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useUpdateCreditCardMutation = (
  providedClient?: CreditCardsClient,
): UseMutationReturnType<CreditCardDto, ApiError, UpdateCreditCardVariables, unknown> => {
  const client = providedClient ?? useCreditCardsClient();

  return createApiMutation(
    ({ id, ...payload }: UpdateCreditCardVariables): Promise<CreditCardDto> =>
      client.updateCreditCard(id, payload),
    {
      successMessage: "Cartão atualizado.",
      invalidates: [["credit-cards", "list"]],
    },
  );
};
