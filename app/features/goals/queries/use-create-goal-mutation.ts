import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type {
  GoalDto,
  CreateGoalPayload,
} from "~/features/goals/contracts/goal.dto";

/**
 * Vue Query mutation hook for creating a new financial goal.
 *
 * Invalidates the goals list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with typed GoalDto result.
 */
export const useCreateGoalMutation = (
  providedClient?: GoalsClient,
): UseMutationReturnType<GoalDto, ApiError, CreateGoalPayload, unknown> => {
  const client = providedClient ?? useGoalsClient();
  return createApiMutation<GoalDto, CreateGoalPayload>(
    (payload) => client.createGoal(payload),
    {
      successMessage: "Meta criada com sucesso.",
      invalidates: [["goals", "list"]],
    },
  );
};
