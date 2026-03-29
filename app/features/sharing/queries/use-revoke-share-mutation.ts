import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import { useSharingClient, type SharingClient } from "~/features/sharing/services/sharing.client";

/**
 * Vue Query mutation hook for revoking a shared entry.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for revoking a shared entry.
 */
export const useRevokeShareMutation = (
  providedClient?: SharingClient,
): UseMutationReturnType<void, Error, string, unknown> => {
  const client = providedClient ?? useSharingClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => {
      return client.revokeSharedEntry(id);
    },
  });
};
