import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { TagDto } from "~/features/tags/contracts/tag.dto";
import { useTagsClient, type TagsClient } from "~/features/tags/services/tags.client";

export type UpdateTagVariables = {
  readonly id: string;
  readonly name: string;
};

/**
 * Vue Query mutation hook for updating a tag.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useUpdateTagMutation = (
  providedClient?: TagsClient,
): UseMutationReturnType<TagDto, ApiError, UpdateTagVariables, unknown> => {
  const client = providedClient ?? useTagsClient();

  return createApiMutation(
    ({ id, name }: UpdateTagVariables): Promise<TagDto> => client.updateTag(id, { name }),
    {
      successMessage: "Tag atualizada.",
      invalidates: [["tags", "list"]],
    },
  );
};
