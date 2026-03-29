import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";

/**
 * Vue Query mutation hook for deleting a financial goal by ID.
 *
 * Invalidates the goals list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteGoalMutation = (
  providedClient?: GoalsClient,
): UseMutationReturnType<undefined, ApiError, string, unknown> => {
  const client = providedClient ?? useGoalsClient();
  return createApiMutation<undefined, string>(
    async (id) => {
      await client.deleteGoal(id);
      return undefined;
    },
    {
      successMessage: "Meta removida.",
      invalidates: [["goals", "list"]],
    },
  );
};
