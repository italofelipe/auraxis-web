import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type {
  GoalDto,
  UpdateGoalPayload,
} from "~/features/goals/contracts/goal.dto";

/**
 * Variables type for the update goal mutation.
 * Combines the goal ID with the partial update payload.
 */
export type UpdateGoalVariables = { readonly id: string } & UpdateGoalPayload;

/**
 * Vue Query mutation hook for updating an existing financial goal.
 *
 * Invalidates the goals list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with typed GoalDto result.
 */
export const useUpdateGoalMutation = (
  providedClient?: GoalsClient,
): UseMutationReturnType<GoalDto, ApiError, UpdateGoalVariables, unknown> => {
  const client = providedClient ?? useGoalsClient();
  return createApiMutation<GoalDto, UpdateGoalVariables>(
    ({ id, ...payload }) => client.updateGoal(id, payload),
    {
      successMessage: "Meta atualizada com sucesso.",
      invalidates: [["goals", "list"]],
    },
  );
};
