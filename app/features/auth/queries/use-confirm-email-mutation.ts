import type { UseMutationReturnType } from "@tanstack/vue-query";
import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  type AuthEmailClient,
  type ConfirmEmailResult,
  useAuthEmailClient,
} from "~/features/auth/services/auth-email.client";

/**
 * Vue Query mutation for confirming an email address (magic-link login).
 *
 * Sends the HMAC token from the URL to the backend; on success the backend
 * (a) marks the email as verified, (b) emits a fresh access JWT, and (c) sets
 * a refresh cookie. The mutation returns `{ token, user }` so the caller can
 * hydrate the session store and route the user into the app without ever
 * showing a login form (#1338).
 *
 * Invalidates the subscription query because the verified flag participates
 * in plan-level gating elsewhere in the UI.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `data`, etc.
 */
export const useConfirmEmailMutation = (
  providedClient?: AuthEmailClient,
): UseMutationReturnType<ConfirmEmailResult, ApiError, string, unknown> => {
  const client = providedClient ?? useAuthEmailClient();
  return createApiMutation<ConfirmEmailResult, string>(
    async (token) => client.confirmEmail(token),
    {
      invalidates: [["subscription", "me"]],
    },
  );
};
