import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import type {
  AdminUserMutationInput,
  AdminUserMutationResult,
} from "~/features/admin/users/model/admin-user";
import {
  type AdminUsersClient,
  useAdminUsersClient,
} from "~/features/admin/users/services/admin-users.client";

/**
 * Builds one audited user mutation and refreshes list/detail caches.
 *
 * @param mutate Client operation to execute.
 * @param providedClient Optional test client.
 * @returns Vue Query mutation state.
 */
const useAdminMutation = (
  mutate: (
    client: AdminUsersClient,
    input: AdminUserMutationInput,
  ) => Promise<AdminUserMutationResult>,
  providedClient?: AdminUsersClient,
): UseMutationReturnType<AdminUserMutationResult, Error, AdminUserMutationInput, unknown> => {
  const client = providedClient ?? useAdminUsersClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => mutate(client, input),
    onSuccess: async (_result, input): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "users", "detail", input.userRef],
      });
    },
  });
};

/**
 * @param client Optional test client.
 * @returns Mutation for total account blocking.
 */
export const useBlockAdminUserMutation = (
  client?: AdminUsersClient,
): UseMutationReturnType<AdminUserMutationResult, Error, AdminUserMutationInput, unknown> =>
  useAdminMutation((resolved, input) => resolved.blockUser(input), client);

/**
 * @param client Optional test client.
 * @returns Mutation for account unblocking.
 */
export const useUnblockAdminUserMutation = (
  client?: AdminUsersClient,
): UseMutationReturnType<AdminUserMutationResult, Error, AdminUserMutationInput, unknown> =>
  useAdminMutation((resolved, input) => resolved.unblockUser(input), client);

/**
 * @param client Optional test client.
 * @returns Mutation for granting a premium override.
 */
export const useGrantPremiumOverrideMutation = (
  client?: AdminUsersClient,
): UseMutationReturnType<AdminUserMutationResult, Error, AdminUserMutationInput, unknown> =>
  useAdminMutation((resolved, input) => resolved.grantPremiumOverride(input), client);

/**
 * @param client Optional test client.
 * @returns Mutation for revoking a premium override.
 */
export const useRevokePremiumOverrideMutation = (
  client?: AdminUsersClient,
): UseMutationReturnType<AdminUserMutationResult, Error, AdminUserMutationInput, unknown> =>
  useAdminMutation((resolved, input) => resolved.revokePremiumOverride(input), client);
