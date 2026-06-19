import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { computed, unref, type Ref } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useGoalsClient,
  type GoalsClient,
} from "~/features/goals/services/goals.client";
import type { GoalContributionListDto } from "~/features/goals/contracts/contributions.dto";

/** Default page size for the contributions history. */
const DEFAULT_PER_PAGE = 10;

/**
 * Vue Query hook for listing a goal's contributions, paginated and newest
 * first, from GET /goals/:id/contributions.
 *
 * The query is disabled when goalId is null. Errors propagate as query error
 * state — no silent catch.
 *
 * @param goalId Reactive ref to the goal ID. Pass null to disable the query.
 * @param page Reactive ref (or plain number) for the 1-based page.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with the typed contributions list.
 */
export const useGoalContributionsQuery = (
  goalId: Ref<string | null>,
  page: Ref<number> | number = 1,
  providedClient?: GoalsClient,
): UseQueryReturnType<GoalContributionListDto, Error> => {
  const client = providedClient ?? useGoalsClient();
  const pageValue = computed(() => unref(page));

  return useQuery({
    queryKey: ["goals", goalId, "contributions", pageValue] as const,
    queryFn: (): Promise<GoalContributionListDto> =>
      client.listContributions(goalId.value!, {
        page: pageValue.value,
        perPage: DEFAULT_PER_PAGE,
      }),
    enabled: computed(() => goalId.value !== null),
    staleTime: STALE_TIME.STABLE,
  });
};
