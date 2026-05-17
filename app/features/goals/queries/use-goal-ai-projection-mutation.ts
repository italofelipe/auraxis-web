import {
  type QueryKey,
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";

import {
  type GoalsClient,
  useGoalsClient,
} from "~/features/goals/services/goals.client";
import type {
  GoalAIProjectionPayload,
  GoalAIProjectionResponseDto,
} from "~/features/goals/contracts/goal.dto";

export const GOAL_AI_PROJECTION_CACHE_TTL_MS = 60 * 60 * 1000;

type GoalAIProjectionCacheEntry = {
  readonly data: GoalAIProjectionResponseDto;
  readonly cachedAt: number;
};

export type GenerateGoalAIProjectionVariables = {
  readonly goalId: string;
  readonly payload: GoalAIProjectionPayload;
};

/**
 * Builds the cache key for an AI goal projection request.
 *
 * @param goalId Goal identifier.
 * @param payload Projection request payload.
 * @returns Vue Query cache key scoped to the exact request.
 */
export const buildGoalAIProjectionCacheKey = (
  goalId: string,
  payload: GoalAIProjectionPayload,
): QueryKey => [
  "goals",
  goalId,
  "ai-projection",
  payload.monthly_contribution,
  payload.user_context,
];

/**
 * Generates a premium goal projection narrative and caches identical requests.
 *
 * @param providedClient Optional client injection for unit tests.
 * @returns Vue Query mutation state for AI goal projection.
 */
export const useGoalAIProjectionMutation = (
  providedClient?: GoalsClient,
): UseMutationReturnType<
  GoalAIProjectionResponseDto,
  Error,
  GenerateGoalAIProjectionVariables,
  unknown
> => {
  const client = providedClient ?? useGoalsClient();
  const queryClient = useQueryClient();

  return useMutation<GoalAIProjectionResponseDto, Error, GenerateGoalAIProjectionVariables>({
    mutationFn: async ({ goalId, payload }) => {
      const cacheKey = buildGoalAIProjectionCacheKey(goalId, payload);
      const cached = queryClient.getQueryData<GoalAIProjectionCacheEntry>(cacheKey);

      if (cached && Date.now() - cached.cachedAt < GOAL_AI_PROJECTION_CACHE_TTL_MS) {
        return cached.data;
      }

      const data = await client.generateGoalAIProjection(goalId, payload);
      queryClient.setQueryData<GoalAIProjectionCacheEntry>(cacheKey, {
        data,
        cachedAt: Date.now(),
      });

      return data;
    },
  });
};
