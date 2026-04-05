import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { AccountDto, AccountType } from "~/features/accounts/contracts/account.dto";
import { useAccountsClient, type AccountsClient } from "~/features/accounts/services/accounts.client";

export type UpdateAccountVariables = {
  readonly id: string;
  readonly name: string;
  readonly account_type: AccountType;
  readonly institution?: string | null;
  readonly initial_balance?: number;
};

/**
 * Vue Query mutation hook for updating an account.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useUpdateAccountMutation = (
  providedClient?: AccountsClient,
): UseMutationReturnType<AccountDto, ApiError, UpdateAccountVariables, unknown> => {
  const client = providedClient ?? useAccountsClient();

  return createApiMutation(
    ({ id, name, account_type, institution, initial_balance }: UpdateAccountVariables): Promise<AccountDto> =>
      client.updateAccount(id, { name, account_type, institution, initial_balance }),
    {
      successMessage: "Conta atualizada.",
      invalidates: [["accounts", "list"]],
    },
  );
};
