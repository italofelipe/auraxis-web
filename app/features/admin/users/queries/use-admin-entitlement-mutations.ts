import {
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";

import type {
  AdminEntitlementMutationResult,
  GrantAdminEntitlementInput,
  RevokeAdminEntitlementInput,
} from "~/features/admin/users/model/admin-user";
import {
  type AdminUsersClient,
  useAdminUsersClient,
} from "~/features/admin/users/services/admin-users.client";

/**
 * Invalidates admin user caches touched by entitlement mutations.
 *
 * @param queryClient Vue Query client instance.
 * @param userId Optional user detail id to refresh.
 */
const invalidateAdminUsers = async (
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string,
): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  if (userId) {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", userId] });
  }
};

/**
 * Creates the mutation used to grant an entitlement from the admin console.
 *
 * @param providedClient Optional client for unit tests.
 * @returns Vue Query mutation for entitlement grants.
 */
export const useGrantAdminEntitlementMutation = (
  providedClient?: AdminUsersClient,
): UseMutationReturnType<
  AdminEntitlementMutationResult,
  Error,
  GrantAdminEntitlementInput,
  unknown
> => {
  const client = providedClient ?? useAdminUsersClient();
  const queryClient = useQueryClient();

  return useMutation<
    AdminEntitlementMutationResult,
    Error,
    GrantAdminEntitlementInput
  >({
    mutationFn: (input) => client.grantEntitlement(input),
    onSuccess: async (_data, input): Promise<void> => {
      await invalidateAdminUsers(queryClient, input.userId);
    },
  });
};

/**
 * Creates the mutation used to revoke an entitlement from the admin console.
 *
 * @param providedClient Optional client for unit tests.
 * @returns Vue Query mutation for entitlement revokes.
 */
export const useRevokeAdminEntitlementMutation = (
  providedClient?: AdminUsersClient,
): UseMutationReturnType<
  AdminEntitlementMutationResult,
  Error,
  RevokeAdminEntitlementInput,
  unknown
> => {
  const client = providedClient ?? useAdminUsersClient();
  const queryClient = useQueryClient();

  return useMutation<
    AdminEntitlementMutationResult,
    Error,
    RevokeAdminEntitlementInput
  >({
    mutationFn: (input) => client.revokeEntitlement(input),
    onSuccess: async (): Promise<void> => {
      await invalidateAdminUsers(queryClient);
    },
  });
};
