import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import {
  type AIInsightsApiClient,
  useAIInsightsApiClient,
} from "~/features/ai-insights/api/ai-insights-api";
import type {
  InsightFeedbackDTO,
  SubmitInsightFeedbackRequestDTO,
} from "~/features/ai-insights/contracts/ai-insight";

export interface SubmitInsightFeedbackVariables {
  readonly insightId: string;
  readonly feedback: SubmitInsightFeedbackRequestDTO;
}

/**
 * Mutation hook for submitting a rating/comment on a persisted AI insight.
 *
 * Mirrors `POST /ai/insights/<insight_id>/feedback`. The insight id comes from
 * the generation response or a history item — only persisted insights can be
 * rated.
 *
 * @param providedClient Optional injected API client for tests.
 * @returns Vue Query mutation state.
 */
export const useSubmitInsightFeedback = (
  providedClient?: AIInsightsApiClient,
): UseMutationReturnType<
  InsightFeedbackDTO,
  ApiError,
  SubmitInsightFeedbackVariables,
  unknown
> => {
  const client = providedClient ?? useAIInsightsApiClient();

  return useMutation<InsightFeedbackDTO, ApiError, SubmitInsightFeedbackVariables>({
    mutationFn: (variables) =>
      client.submitInsightFeedback(variables.insightId, variables.feedback),
  });
};
