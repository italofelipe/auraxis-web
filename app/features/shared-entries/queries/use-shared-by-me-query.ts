import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import {
  useSharedEntriesClient,
  type SharedEntriesClient,
} from "~/features/shared-entries/services/shared-entries.client";
import { MOCK_SHARED_BY_ME } from "~/features/shared-entries/mock/shared-entries.mock";
import type { SharedEntryDto } from "~/features/shared-entries/contracts/shared-entry.dto";

/**
 * Vue Query hook for the list of entries shared by the authenticated user.
 *
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed SharedEntryDto[] data.
 */
export const useSharedByMeQuery = (
  providedClient?: SharedEntriesClient,
): UseQueryReturnType<SharedEntryDto[], Error> => {
  const client = providedClient ?? useSharedEntriesClient();

  return useQuery({
    queryKey: ["shared-entries", "by-me"] as const,
    queryFn: (): Promise<SharedEntryDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_SHARED_BY_ME);
      }
      return client.getSharedByMe();
    },
  });
};
