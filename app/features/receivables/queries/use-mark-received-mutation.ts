import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useReceivablesClient,
  type ReceivablesClient,
} from "~/features/receivables/services/receivables.client";
import type { ReceivableEntry } from "~/features/receivables/model/receivables";

export interface MarkReceivedVariables {
  /** UUID of the receivable entry to mark as received. */
  readonly id: string;
  /**
   * ISO date string (YYYY-MM-DD) when the payment was received.
   * Defaults to today's date when omitted.
   */
  readonly receivedDate?: string;
}

/**
 * Vue Query mutation hook for marking a receivable entry as received.
 *
 * Invalidates the receivables list and revenue summary queries on success so
 * the UI reflects the updated status and totals immediately.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for the mark-received operation.
 */
export const useMarkReceivedMutation = (
  providedClient?: ReceivablesClient,
): UseMutationReturnType<ReceivableEntry, Error, MarkReceivedVariables, unknown> => {
  const client = providedClient ?? useReceivablesClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, receivedDate }: MarkReceivedVariables): Promise<ReceivableEntry> => {
      const date = receivedDate ?? new Date().toISOString().split("T")[0]!;
      return client.markReceived(id, date);
    },
    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["receivables", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["receivables", "summary"] }),
      ]);
    },
  });
};
