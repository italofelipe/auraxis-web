import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { AccountDto, CreateAccountPayload } from "~/features/accounts/contracts/account.dto";
import { useAccountsClient, type AccountsClient } from "~/features/accounts/services/accounts.client";

/**
 * Vue Query mutation hook for creating a new account.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useCreateAccountMutation = (
  providedClient?: AccountsClient,
): UseMutationReturnType<AccountDto, ApiError, CreateAccountPayload, unknown> => {
  const client = providedClient ?? useAccountsClient();

  return createApiMutation(
    (payload: CreateAccountPayload): Promise<AccountDto> => client.createAccount(payload),
    {
      successMessage: "Conta criada.",
      invalidates: [["accounts", "list"]],
    },
  );
};
