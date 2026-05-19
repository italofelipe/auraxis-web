import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type {
  PrivacyDeletionRequestDto,
  PrivacyDeletionRequestPayload,
} from "~/features/privacy/contracts/privacy-center.dto";
import {
  type PrivacyCenterClient,
  usePrivacyCenterClient,
} from "~/features/privacy/services/privacy-center.client";

/**
 * Requests LGPD account deletion/anonymisation.
 *
 * @param providedClient Optional client used by unit tests.
 * @returns Vue Query mutation state.
 */
export const useRequestAccountDeletionMutation = (
  providedClient?: PrivacyCenterClient,
): UseMutationReturnType<
  PrivacyDeletionRequestDto,
  ApiError,
  PrivacyDeletionRequestPayload,
  unknown
> => {
  const client = providedClient ?? usePrivacyCenterClient();
  return createApiMutation<PrivacyDeletionRequestDto, PrivacyDeletionRequestPayload>(
    (payload) => client.requestDeletion(payload),
    { successMessage: "Solicitação de exclusão enviada." },
  );
};
