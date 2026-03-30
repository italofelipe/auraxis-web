import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useReceivablesClient,
  type ReceivablesClient,
} from "~/features/receivables/services/receivables.client";

/**
 * Vue Query mutation hook for deleting a receivable entry.
 *
 * Invalidates the receivables list and revenue summary queries on success so
 * the UI reflects the removal immediately.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for the delete operation.
 */
export const useDeleteReceivableMutation = (
  providedClient?: ReceivablesClient,
): UseMutationReturnType<void, Error, string, unknown> => {
  const client = providedClient ?? useReceivablesClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => {
      return client.deleteReceivable(id);
    },
    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["receivables", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["receivables", "summary"] }),
      ]);
    },
  });
};
