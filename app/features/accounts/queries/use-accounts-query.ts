import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import type { AccountDto } from "~/features/accounts/contracts/account.dto";
import { MOCK_ACCOUNTS } from "~/features/accounts/mock/accounts.mock";
import { useAccountsClient, type AccountsClient } from "~/features/accounts/services/accounts.client";

/**
 * Vue Query hook for listing the authenticated user's accounts.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed AccountDto array.
 */
export const useAccountsQuery = (
  providedClient?: AccountsClient,
): UseQueryReturnType<AccountDto[], Error> => {
  const client = providedClient ?? useAccountsClient();

  return useQuery({
    queryKey: ["accounts", "list"] as const,
    queryFn: (): Promise<AccountDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_ACCOUNTS);
      }
      return client.listAccounts();
    },
  });
};
