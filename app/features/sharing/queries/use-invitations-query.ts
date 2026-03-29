import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { useSharingClient, type SharingClient } from "~/features/sharing/services/sharing.client";
import type { Invitation } from "~/features/sharing/model/sharing";

/**
 * Vue Query hook for the list of invitations created by the authenticated user.
 *
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed Invitation[] data.
 */
export const useInvitationsQuery = (
  providedClient?: SharingClient,
): UseQueryReturnType<Invitation[], Error> => {
  const client = providedClient ?? useSharingClient();

  return useQuery({
    queryKey: ["sharing", "invitations"] as const,
    queryFn: (): Promise<Invitation[]> => {
      return client.getInvitations();
    },
  });
};
