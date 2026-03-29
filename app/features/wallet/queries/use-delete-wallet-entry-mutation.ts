import type { UseMutationReturnType } from "@tanstack/vue-query";
import { createApiMutation } from "~/core/query/use-api-mutation";
import { useWalletClient, type WalletClient } from "~/features/wallet/services/wallet.client";
import type { ApiError } from "~/core/errors";

/**
 * Vue Query mutation hook for deleting a wallet entry by its identifier.
 *
 * On success it invalidates both the entries list and the portfolio summary
 * so all derived views refresh automatically.
 *
 * @param providedClient - Optional injected WalletClient for unit tests.
 * @returns TanStack Vue Query mutation state.
 */
export const useDeleteWalletEntryMutation = (
  providedClient?: WalletClient,
): UseMutationReturnType<undefined, ApiError, string, unknown> => {
  const client = providedClient ?? useWalletClient();

  return createApiMutation<undefined, string>(
    (id: string): Promise<undefined> =>
      client.deleteEntry(id).then(() => undefined),
    {
      successMessage: "Ativo removido.",
      invalidates: [["wallet", "entries"], ["wallet", "summary"]],
    },
  );
};
