import { useMutation, useQueryClient } from "@tanstack/vue-query";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query mutation hook for marking a transaction as "paid".
 *
 * Calls PATCH /transactions/:id with `{ status: "paid" }` and invalidates
 * the list cache on success.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Mutation object with `mutate(id)` and standard state fields.
 */
export const useMarkTransactionPaidMutation = (
  providedClient?: TransactionsClient,
): ReturnType<typeof useMutation<TransactionDto, Error, string>> => {
  const client = providedClient ?? useTransactionsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<TransactionDto> => client.updateStatus(id, "paid"),

    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", "list"] });
    },
  });
};
