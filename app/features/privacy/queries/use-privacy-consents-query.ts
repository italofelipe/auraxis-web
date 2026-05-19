import type { UseQueryReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiQuery } from "~/core/query/use-api-query";
import { STALE_TIME } from "~/core/query/stale-time";
import type { PrivacyConsentListDto } from "~/features/privacy/contracts/privacy-center.dto";
import {
  type PrivacyCenterClient,
  usePrivacyCenterClient,
} from "~/features/privacy/services/privacy-center.client";

export const PRIVACY_CONSENTS_QUERY_KEY = ["privacy", "consents"] as const;

/**
 * Loads consent records for the authenticated user.
 *
 * @param providedClient Optional client used by unit tests.
 * @returns Vue Query state for the privacy consent list.
 */
export const usePrivacyConsentsQuery = (
  providedClient?: PrivacyCenterClient,
): UseQueryReturnType<PrivacyConsentListDto, ApiError> => {
  const client = providedClient ?? usePrivacyCenterClient();
  return createApiQuery(
    PRIVACY_CONSENTS_QUERY_KEY,
    () => client.listConsents(),
    { staleTime: STALE_TIME.STABLE },
  );
};
