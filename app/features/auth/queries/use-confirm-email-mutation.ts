import type { UseMutationReturnType } from "@tanstack/vue-query";
import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  type AuthEmailClient,
  useAuthEmailClient,
} from "~/features/auth/services/auth-email.client";

/**
 * Vue Query mutation hook for confirming an email address.
 *
 * Accepts the confirmation token from the URL and sends it to the backend.
 * On success, invalidates the session so the UI reflects the confirmed state.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 */
export const useConfirmEmailMutation = (
  providedClient?: AuthEmailClient,
): UseMutationReturnType<undefined, ApiError, string, unknown> => {
  const client = providedClient ?? useAuthEmailClient();
  return createApiMutation<undefined, string>(
    async (token) => { await client.confirmEmail(token); return undefined; },
    {
      invalidates: [["subscription", "me"]],
    },
  );
};
