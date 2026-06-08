import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import type {
  GoalContributionDto,
  RecordGoalContributionPayload,
} from "~/features/goals/contracts/contributions.dto";

/** Result returned by a successful contribution mutation. */
export type RecordContributionResult = {
  readonly goal: GoalDto;
  readonly contribution: GoalContributionDto;
};

/**
 * Vue Query mutation hook for recording a contribution against a goal.
 *
 * On success it invalidates the goals list, this goal's contributions history,
 * and this goal's projection so progress, timeline, and forecast all refresh.
 * Errors propagate as mutation error state — no silent catch — so callers can
 * surface domain errors such as INSUFFICIENT_BALANCE.
 *
 * @param goalId Goal the contribution belongs to.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with the updated goal and contribution.
 */
export const useRecordContributionMutation = (
  goalId: string,
  providedClient?: GoalsClient,
): UseMutationReturnType<
  RecordContributionResult,
  ApiError,
  RecordGoalContributionPayload,
  unknown
> => {
  const client = providedClient ?? useGoalsClient();
  return createApiMutation<RecordContributionResult, RecordGoalContributionPayload>(
    (payload) => client.recordContribution(goalId, payload),
    {
      invalidates: [
        ["goals", "list"],
        ["goals", goalId, "contributions"],
        ["goals", goalId, "projection"],
      ],
    },
  );
};
