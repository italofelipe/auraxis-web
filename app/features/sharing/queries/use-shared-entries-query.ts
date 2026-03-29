import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { useSharingClient, type SharingClient } from "~/features/sharing/services/sharing.client";
import type { SharedEntry } from "~/features/sharing/model/sharing";

/**
 * Vue Query hook for the list of entries shared by the authenticated user.
 *
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed SharedEntry[] data.
 */
export const useSharedByMeQuery = (
  providedClient?: SharingClient,
): UseQueryReturnType<SharedEntry[], Error> => {
  const client = providedClient ?? useSharingClient();

  return useQuery({
    queryKey: ["sharing", "by-me"] as const,
    queryFn: (): Promise<SharedEntry[]> => {
      return client.getSharedByMe();
    },
  });
};

/**
 * Vue Query hook for the list of entries shared with the authenticated user.
 *
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed SharedEntry[] data.
 */
export const useSharedWithMeQuery = (
  providedClient?: SharingClient,
): UseQueryReturnType<SharedEntry[], Error> => {
  const client = providedClient ?? useSharingClient();

  return useQuery({
    queryKey: ["sharing", "with-me"] as const,
    queryFn: (): Promise<SharedEntry[]> => {
      return client.getSharedWithMe();
    },
  });
};
