import type { UseMutationReturnType } from "@tanstack/vue-query";
import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import {
  type UserAccountClient,
  useUserAccountClient,
} from "~/features/user/services/user-account.client";

/**
 * Vue Query mutation hook for permanently deleting the authenticated user's
 * account (LGPD compliance).
 *
 * The mutation requires the user's current password for identity confirmation.
 * On success the caller is responsible for logging the user out and redirecting.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 */
export const useDeleteAccountMutation = (
  providedClient?: UserAccountClient,
): UseMutationReturnType<undefined, ApiError, string, unknown> => {
  const client = providedClient ?? useUserAccountClient();
  return createApiMutation<undefined, string>(
    async (password) => {
      await client.deleteAccount(password);
      return undefined;
    },
  );
};
