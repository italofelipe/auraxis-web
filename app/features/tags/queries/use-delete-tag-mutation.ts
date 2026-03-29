import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import { useTagsClient, type TagsClient } from "~/features/tags/services/tags.client";

/**
 * Vue Query mutation hook for deleting a tag.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteTagMutation = (
  providedClient?: TagsClient,
): UseMutationReturnType<void, ApiError, string, unknown> => {
  const client = providedClient ?? useTagsClient();

  return createApiMutation(
    (id: string): Promise<void> => client.deleteTag(id),
    {
      successMessage: "Tag removida.",
      invalidates: [["tags", "list"]],
    },
  );
};
