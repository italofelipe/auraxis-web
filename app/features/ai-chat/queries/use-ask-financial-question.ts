import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { type AiChatApiClient, useAiChatApiClient } from "~/features/ai-chat/api/ai-chat-api";
import type { AIChatResponseDTO } from "~/features/ai-chat/contracts/ai-chat";

/**
 * Mutation hook that asks a finance question against `POST /ai/chat`.
 *
 * Asking is a one-shot user action: a 429 daily-limit (or any error) is a
 * legitimate terminal response, never a transient failure to retry.
 *
 * @param providedClient Optional injected API client for tests.
 * @returns Vue Query mutation state keyed by the question string.
 */
export const useAskFinancialQuestion = (
  providedClient?: AiChatApiClient,
): UseMutationReturnType<AIChatResponseDTO, ApiError, string, unknown> => {
  const client = providedClient ?? useAiChatApiClient();

  return useMutation<AIChatResponseDTO, ApiError, string>({
    mutationFn: (question) => client.askFinancialQuestion(question),
    retry: false,
  });
};
