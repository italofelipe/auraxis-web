import { type QueryKey, type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import {
  type AIInsightsApiClient,
  useAIInsightsApiClient,
} from "~/features/ai-insights/api/ai-insights-api";
import type { GenerateInsightResponseWithMetaDTO } from "~/features/ai-insights/contracts/ai-insight";
import type { GenerateAIInsightVariables } from "~/features/ai-insights/model/ai-insight";

interface UseGenerateAIInsightOptions {
  readonly invalidateQueries?: (args: { queryKey: QueryKey }) => void | Promise<void>;
}

const INVALIDATION_KEYS: QueryKey[] = [
  ["ai-insights", "history"],
  ["dashboard", "overview"],
];

/**
 * Mutation hook for generating a period-aware insight with rate-limit metadata.
 *
 * @param providedClient Optional injected API client for tests.
 * @param options Optional invalidation adapter for tests.
 * @returns Vue Query mutation state.
 */
export const useGenerateAIInsight = (
  providedClient?: AIInsightsApiClient,
  options?: UseGenerateAIInsightOptions,
): UseMutationReturnType<
  GenerateInsightResponseWithMetaDTO,
  ApiError,
  GenerateAIInsightVariables | undefined,
  unknown
> => {
  const client = providedClient ?? useAIInsightsApiClient();
  const queryClient = options?.invalidateQueries ? null : useQueryClient();

  /**
   * Invalidates dependent surfaces after insight generation.
   *
   * @param queryKey Query key to invalidate.
   */
  const invalidate = async (queryKey: QueryKey): Promise<void> => {
    if (options?.invalidateQueries) {
      await options.invalidateQueries({ queryKey });
      return;
    }

    await queryClient?.invalidateQueries({ queryKey });
  };

  return useMutation<GenerateInsightResponseWithMetaDTO, ApiError, GenerateAIInsightVariables | undefined>({
    mutationFn: (variables) => client.generateInsight({
      periodType: variables?.periodType ?? "daily",
      ...(variables?.anchorDate ? { anchorDate: variables.anchorDate } : {}),
      ...(variables?.sourceSurface ? { sourceSurface: variables.sourceSurface } : {}),
    }),
    // Generation is a one-shot user action; a 429 daily-limit (or any error) is
    // a legitimate terminal response, never a transient failure to retry.
    retry: false,
    onSuccess: async (): Promise<void> => {
      await Promise.all(INVALIDATION_KEYS.map((queryKey) => invalidate(queryKey)));
    },
  });
};
