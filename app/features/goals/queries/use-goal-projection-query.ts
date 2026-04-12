import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type { GoalProjectionResponseDto } from "~/features/goals/contracts/goal.dto";

/**
 * Vue Query hook for fetching the compound-interest, portfolio-aware
 * goal projection from GET /goals/:id/projection.
 *
 * The query is disabled when goalId is null. Errors propagate as query error
 * state — no silent catch.
 *
 * @param goalId Reactive ref to the goal ID. Pass null to disable the query.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed GoalProjectionResponseDto data.
 */
export const useGoalProjectionQuery = (
  goalId: Ref<string | null>,
  providedClient?: GoalsClient,
): UseQueryReturnType<GoalProjectionResponseDto, Error> => {
  const client = providedClient ?? useGoalsClient();
  return useQuery({
    queryKey: ["goals", goalId, "projection"] as const,
    queryFn: (): Promise<GoalProjectionResponseDto> =>
      client.getGoalProjection(goalId.value!),
    enabled: computed(() => goalId.value !== null),
    staleTime: STALE_TIME.STABLE,
  });
};
