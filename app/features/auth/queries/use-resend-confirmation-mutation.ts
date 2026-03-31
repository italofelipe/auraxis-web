import type { UseMutationReturnType } from "@tanstack/vue-query";
import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  type AuthEmailClient,
  useAuthEmailClient,
} from "~/features/auth/services/auth-email.client";

/**
 * Vue Query mutation hook for re-sending the confirmation email.
 *
 * Takes no arguments — the backend derives the user from the session token.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 */
export const useResendConfirmationMutation = (
  providedClient?: AuthEmailClient,
): UseMutationReturnType<undefined, ApiError, undefined, unknown> => {
  const client = providedClient ?? useAuthEmailClient();
  return createApiMutation<undefined, undefined>(
    async () => { await client.resendConfirmation(); return undefined; },
  );
};
