import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import { useSharingClient, type SharingClient } from "~/features/sharing/api/sharing.client";
import type { CreateInvitationParams, Invitation } from "~/features/sharing/model/sharing";

/**
 * Vue Query mutation hook for creating a new invitation.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for creating an invitation.
 */
export const useInviteMutation = (
  providedClient?: SharingClient,
): UseMutationReturnType<Invitation, Error, CreateInvitationParams, unknown> => {
  const client = providedClient ?? useSharingClient();

  return useMutation({
    mutationFn: (params: CreateInvitationParams): Promise<Invitation> => {
      return client.createInvitation(params);
    },
  });
};
