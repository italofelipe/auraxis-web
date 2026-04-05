import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { CreditCardBrand, CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import {
  useCreditCardsClient,
  type CreditCardsClient,
} from "~/features/credit-cards/services/credit-cards.client";

export type UpdateCreditCardVariables = {
  readonly id: string;
  readonly name: string;
  readonly brand?: CreditCardBrand | null;
  readonly limit_amount?: number | null;
  readonly closing_day?: number | null;
  readonly due_day?: number | null;
  readonly last_four_digits?: string | null;
};

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
    ({ id, name, brand, limit_amount, closing_day, due_day, last_four_digits }: UpdateCreditCardVariables): Promise<CreditCardDto> =>
      client.updateCreditCard(id, { name, brand, limit_amount, closing_day, due_day, last_four_digits }),
    {
      successMessage: "Cartão atualizado.",
      invalidates: [["credit-cards", "list"]],
    },
  );
};
