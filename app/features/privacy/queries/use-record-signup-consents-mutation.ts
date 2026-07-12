import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  PRIVACY_POLICY_VERSION,
  TERMS_OF_USE_VERSION,
} from "~/features/legal/legal-documents";
import {
  type PrivacyCenterClient,
  usePrivacyCenterClient,
} from "~/features/privacy/services/privacy-center.client";

/**
 * Records the signup acceptance of the current Terms of Use and Privacy
 * Policy versions with timestamp on the API (`POST /me/consents`) — G2-legal
 * criterion 7 (#1118). Runs right after the post-register auto-login, when a
 * session is available.
 *
 * @param providedClient Optional client used by unit tests.
 * @returns Vue Query mutation state.
 */
export const useRecordSignupConsentsMutation = (
  providedClient?: PrivacyCenterClient,
): UseMutationReturnType<void, ApiError, void, unknown> => {
  const client = providedClient ?? usePrivacyCenterClient();
  return createApiMutation(
    async (): Promise<void> => {
      await client.recordConsent({ kind: "terms", version: TERMS_OF_USE_VERSION });
      await client.recordConsent({ kind: "privacy", version: PRIVACY_POLICY_VERSION });
    },
    {},
  );
};
