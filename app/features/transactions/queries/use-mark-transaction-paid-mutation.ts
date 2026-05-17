import { useMutation, useQueryClient } from "@tanstack/vue-query";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/** Arguments required to mark a transaction as paid. */
export interface MarkTransactionPaidArgs {
  /** UUID of the transaction to mark as paid. */
  readonly id: string;
  /** Effective payment/receipt timestamp in ISO-8601 format. */
  readonly paidAt: string;
}

/**
 * Vue Query mutation hook for marking a transaction as "paid".
 *
 * Calls PATCH /transactions/:id with `{ status: "paid", paid_at }` and
 * invalidates the list cache on success.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Mutation object with `mutate({ id, paidAt })` and standard state fields.
 */
export const useMarkTransactionPaidMutation = (
  providedClient?: TransactionsClient,
): ReturnType<typeof useMutation<TransactionDto, Error, MarkTransactionPaidArgs>> => {
  const client = providedClient ?? useTransactionsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paidAt }: MarkTransactionPaidArgs): Promise<TransactionDto> =>
      client.updateTransaction(id, { status: "paid", paid_at: paidAt }),

    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", "list"] });
    },
  });
};
