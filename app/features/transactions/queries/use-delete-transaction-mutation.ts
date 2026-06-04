import { useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/** Variables for the delete mutation: the id and optional recurring scope. */
export interface DeleteTransactionVars {
  readonly id: string;
  readonly scope?: "occurrence" | "series";
}

/**
 * Vue Query mutation hook for permanently deleting a transaction.
 *
 * Invalidates the `["transactions", "list"]` query key on success so that
 * any active list will automatically re-fetch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Mutation object with `mutate({id, scope})` and standard state fields.
 */
export const useDeleteTransactionMutation = (
  providedClient?: TransactionsClient,
): ReturnType<typeof useMutation<void, Error, DeleteTransactionVars>> => {
  const client = providedClient ?? useTransactionsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scope }: DeleteTransactionVars): Promise<void> =>
      client.deleteTransaction(id, scope ?? "occurrence"),

    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", "list"] });
    },
  });
};
