import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  useInvestorProfileClient,
  type InvestorProfileClient,
} from "~/features/investor-profile/services/investor-profile.client";
import type {
  QuestionnaireResultDto,
  SubmitAnswersPayload,
} from "~/features/investor-profile/contracts/investor-profile.dto";
import type { ApiError } from "~/core/errors";

/**
 * Vue Query mutation hook for submitting investor profile questionnaire answers.
 *
 * On success, invalidates the questionnaire query and invokes the optional
 * onSuccess callback so the page can transition to the result view.
 *
 * @param providedClient Optional injected InvestorProfileClient for unit tests.
 * @returns TanStack Vue Query mutation state.
 */
export const useSubmitAnswersMutation = (
  providedClient?: InvestorProfileClient,
): UseMutationReturnType<QuestionnaireResultDto, ApiError, SubmitAnswersPayload, unknown> => {
  const client = providedClient ?? useInvestorProfileClient();

  return createApiMutation<QuestionnaireResultDto, SubmitAnswersPayload>(
    (payload: SubmitAnswersPayload): Promise<QuestionnaireResultDto> =>
      client.submitAnswers(payload),
    {
      invalidates: [["investor-profile", "questionnaire"]],
    },
  );
};
