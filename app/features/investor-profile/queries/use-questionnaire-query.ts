import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useInvestorProfileClient,
  type InvestorProfileClient,
} from "~/features/investor-profile/services/investor-profile.client";
import type { QuestionnaireDto } from "~/features/investor-profile/contracts/investor-profile.dto";

/**
 * Vue Query hook for fetching the investor profile questionnaire.
 *
 * The questionnaire questions are static — staleTime is set to Infinity so
 * they are fetched only once per session and never re-fetched in the background.
 *
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed QuestionnaireDto.
 */
export const useQuestionnaireQuery = (
  providedClient?: InvestorProfileClient,
): UseQueryReturnType<QuestionnaireDto, Error> => {
  const client = providedClient ?? useInvestorProfileClient();

  return useQuery({
    queryKey: ["investor-profile", "questionnaire"] as const,
    queryFn: (): Promise<QuestionnaireDto> => client.getQuestionnaire(),
    staleTime: Infinity,
  });
};
