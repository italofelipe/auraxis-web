import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import {
  type AIInsightsApiClient,
  useAIInsightsApiClient,
} from "~/features/ai-insights/api/ai-insights-api";

/**
 * Mutation hook for explicitly granting AI consent through the LGPD endpoint.
 *
 * @param providedClient Optional injected API client for tests.
 * @returns Vue Query mutation state.
 */
export const useGrantAIConsent = (
  providedClient?: AIInsightsApiClient,
): UseMutationReturnType<undefined, ApiError, undefined, unknown> => {
  const client = providedClient ?? useAIInsightsApiClient();

  return useMutation<undefined, ApiError, undefined>({
    mutationFn: async (): Promise<undefined> => {
      await client.grantAIConsent();
      return undefined;
    },
  });
};
