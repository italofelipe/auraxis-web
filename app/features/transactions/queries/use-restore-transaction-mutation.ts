import { useMutation, useQueryClient } from "@tanstack/vue-query";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query mutation hook for restoring a soft-deleted transaction.
 *
 * Invalidates both the active transactions list and the deleted list
 * on success so list views re-sync without a manual refresh.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Mutation object with `mutate(id)` and standard state fields.
 */
export const useRestoreTransactionMutation = (
  providedClient?: TransactionsClient,
): ReturnType<typeof useMutation<TransactionDto, Error, string>> => {
  const client = providedClient ?? useTransactionsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<TransactionDto> => client.restoreTransaction(id),

    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions", "deleted"] }),
      ]);
    },
  });
};
