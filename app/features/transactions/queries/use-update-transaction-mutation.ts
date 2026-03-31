import { useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";
import type {
  TransactionDto,
  UpdateTransactionPayload,
} from "~/features/transactions/contracts/transaction.dto";

/** Arguments accepted by the update mutation function. */
export interface UpdateTransactionArgs {
  /** UUID of the transaction to update. */
  readonly id: string;
  /** Partial fields to update. */
  readonly payload: UpdateTransactionPayload;
}

/**
 * Vue Query mutation hook for updating an existing transaction.
 *
 * Invalidates the `["transactions", "list"]` query key on success so that
 * any active list will automatically re-fetch with the updated data.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Mutation object with `mutate({ id, payload })` and standard state fields.
 */
export const useUpdateTransactionMutation = (
  providedClient?: TransactionsClient,
): ReturnType<typeof useMutation<TransactionDto, Error, UpdateTransactionArgs>> => {
  const client = providedClient ?? useTransactionsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateTransactionArgs): Promise<TransactionDto> =>
      client.updateTransaction(id, payload),

    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", "list"] });
    },
  });
};
