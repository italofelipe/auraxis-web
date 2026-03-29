import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import { useAccountsClient, type AccountsClient } from "~/features/accounts/services/accounts.client";

/**
 * Vue Query mutation hook for deleting an account.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteAccountMutation = (
  providedClient?: AccountsClient,
): UseMutationReturnType<void, ApiError, string, unknown> => {
  const client = providedClient ?? useAccountsClient();

  return createApiMutation(
    (id: string): Promise<void> => client.deleteAccount(id),
    {
      successMessage: "Conta removida.",
      invalidates: [["accounts", "list"]],
    },
  );
};
