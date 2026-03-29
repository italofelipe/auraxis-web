import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { CreateTagPayload, TagDto } from "~/features/tags/contracts/tag.dto";
import { useTagsClient, type TagsClient } from "~/features/tags/services/tags.client";

/**
 * Vue Query mutation hook for creating a new tag.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useCreateTagMutation = (
  providedClient?: TagsClient,
): UseMutationReturnType<TagDto, ApiError, CreateTagPayload, unknown> => {
  const client = providedClient ?? useTagsClient();

  return createApiMutation(
    (payload: CreateTagPayload): Promise<TagDto> => client.createTag(payload),
    {
      successMessage: "Tag criada.",
      invalidates: [["tags", "list"]],
    },
  );
};
