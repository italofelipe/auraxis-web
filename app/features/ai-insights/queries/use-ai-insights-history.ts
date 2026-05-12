import { type MaybeRef, computed, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  type AIInsightsApiClient,
  useAIInsightsApiClient,
} from "~/features/ai-insights/api/ai-insights-api";
import type { AIInsightHistoryDTO } from "~/features/ai-insights/contracts/ai-insight";

/**
 * Fetches paginated AI insight history for the authenticated user.
 *
 * @param page Current one-based page number.
 * @param perPage Number of insights per page.
 * @param providedClient Optional injected client for tests.
 * @returns Vue Query state for insight history.
 */
export const useAIInsightsHistory = (
  page: MaybeRef<number> = 1,
  perPage: MaybeRef<number> = 20,
  providedClient?: AIInsightsApiClient,
): UseQueryReturnType<AIInsightHistoryDTO, Error> => {
  const client = providedClient ?? useAIInsightsApiClient();

  return useQuery({
    queryKey: computed(() => [
      "ai-insights",
      "history",
      { page: unref(page), perPage: unref(perPage) },
    ] as const),
    queryFn: () => client.fetchInsightHistory(unref(page), unref(perPage)),
    staleTime: STALE_TIME.ACTIVE,
  });
};
