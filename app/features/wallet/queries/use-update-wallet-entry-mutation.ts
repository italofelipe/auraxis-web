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
 * Input shape for the update mutation — bundles the entry id with the partial payload.
 */
export type UpdateWalletEntryInput = {
  /** Identifier of the entry to update. */
  readonly id: string;
  /** Partial fields to apply via PATCH. */
  readonly payload: Partial<CreateWalletEntryPayload>;
};

/**
 * Vue Query mutation hook for updating an existing wallet entry via PATCH.
 *
 * Uses the atomic PATCH endpoint so a failed update never removes existing data.
 * On success it invalidates both the entries list and the portfolio summary
 * so all derived views refresh automatically.
 *
 * @param providedClient - Optional injected WalletClient for unit tests.
 * @returns TanStack Vue Query mutation state.
 */
export const useUpdateWalletEntryMutation = (
  providedClient?: WalletClient,
): UseMutationReturnType<WalletEntryDto, ApiError, UpdateWalletEntryInput, unknown> => {
  const client = providedClient ?? useWalletClient();

  return createApiMutation<WalletEntryDto, UpdateWalletEntryInput>(
    ({ id, payload }: UpdateWalletEntryInput): Promise<WalletEntryDto> =>
      client.updateEntry(id, payload),
    {
      successMessage: "Ativo atualizado com sucesso.",
      invalidates: [["wallet", "entries"], ["wallet", "summary"]],
    },
  );
};
