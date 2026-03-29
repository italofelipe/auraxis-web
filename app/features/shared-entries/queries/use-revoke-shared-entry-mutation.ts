import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useSharedEntriesClient,
  type SharedEntriesClient,
} from "~/features/shared-entries/services/shared-entries.client";

/**
 * Vue Query mutation hook for revoking a shared entry.
 *
 * Invalidates both shared-entries lists on success so the UI reflects the removal.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for revoking a shared entry.
 */
export const useRevokeSharedEntryMutation = (
  providedClient?: SharedEntriesClient,
): UseMutationReturnType<void, Error, string, unknown> => {
  const client = providedClient ?? useSharedEntriesClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => {
      return client.revokeSharedEntry(id);
    },
    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shared-entries", "by-me"] }),
        queryClient.invalidateQueries({ queryKey: ["shared-entries", "with-me"] }),
      ]);
    },
  });
};
