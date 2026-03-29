import type { UseMutationReturnType } from "@tanstack/vue-query";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  useWalletClient,
  type WalletClient,
  type CreateWalletEntryPayload,
} from "~/features/wallet/services/wallet.client";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import type { ApiError } from "~/core/errors";

/**
 * Vue Query mutation hook for creating a new wallet entry.
 *
 * On success it invalidates both the entries list and the portfolio summary
 * so all derived views refresh automatically.
 *
 * @param providedClient - Optional injected WalletClient for unit tests.
 * @returns TanStack Vue Query mutation state.
 */
export const useCreateWalletEntryMutation = (
  providedClient?: WalletClient,
): UseMutationReturnType<WalletEntryDto, ApiError, CreateWalletEntryPayload, unknown> => {
  const client = providedClient ?? useWalletClient();

  return createApiMutation<WalletEntryDto, CreateWalletEntryPayload>(
    (payload: CreateWalletEntryPayload): Promise<WalletEntryDto> =>
      client.createEntry(payload),
    {
      successMessage: "Ativo adicionado à carteira.",
      invalidates: [["wallet", "entries"], ["wallet", "summary"]],
    },
  );
};
