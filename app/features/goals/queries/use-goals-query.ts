import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import { useGoalsClient, type GoalsClient } from "~/features/goals/services/goals.client";
import { MOCK_GOALS } from "~/features/goals/mock/goals.mock";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

/**
 * Vue Query hook for listing the authenticated user's financial goals.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed GoalDto array.
 */
export const useGoalsQuery = (
  providedClient?: GoalsClient,
): UseQueryReturnType<GoalDto[], Error> => {
  const client = providedClient ?? useGoalsClient();

  return useQuery({
    queryKey: ["goals", "list"] as const,
    queryFn: (): Promise<GoalDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_GOALS);
      }

      return client.listGoals();
    },
    staleTime: STALE_TIME.STABLE,
  });
};
