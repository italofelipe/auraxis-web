import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";

import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type { GoalPlanDto } from "~/features/goals/contracts/goal.dto";

/**
 * Vue Query hook for fetching the planning projection for a financial goal.
 *
 * The query is disabled when goalId is null. Errors propagate as query error
 * state — no silent catch.
 *
 * @param goalId Reactive ref to the goal ID. Pass null to disable the query.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed GoalPlanDto data.
 */
export const useGoalPlanQuery = (
  goalId: Ref<string | null>,
  providedClient?: GoalsClient,
): UseQueryReturnType<GoalPlanDto, Error> => {
  const client = providedClient ?? useGoalsClient();
  return useQuery({
    queryKey: ["goals", goalId, "plan"] as const,
    queryFn: (): Promise<GoalPlanDto> => client.getGoalPlan(goalId.value!),
    enabled: computed(() => goalId.value !== null),
  });
};
