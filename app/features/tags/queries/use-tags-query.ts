import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import type { TagDto } from "~/features/tags/contracts/tag.dto";
import { MOCK_TAGS } from "~/features/tags/mock/tags.mock";
import { useTagsClient, type TagsClient } from "~/features/tags/services/tags.client";

/**
 * Vue Query hook for listing the authenticated user's tags.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed TagDto array.
 */
export const useTagsQuery = (
  providedClient?: TagsClient,
): UseQueryReturnType<TagDto[], Error> => {
  const client = providedClient ?? useTagsClient();

  return useQuery({
    queryKey: ["tags", "list"] as const,
    queryFn: (): Promise<TagDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_TAGS);
      }
      return client.listTags();
    },
    staleTime: STALE_TIME.STATIC,
  });
};
