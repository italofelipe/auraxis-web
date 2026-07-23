import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminUserDetail } from "~/features/admin/users/model/admin-user";
import {
  type AdminUsersClient,
  useAdminUsersClient,
} from "~/features/admin/users/services/admin-users.client";

/**
 * Builds the cache key for one admin user detail query.
 *
 * @param userId Selected user id.
 * @returns Stable Vue Query key.
 */
export const adminUserDetailQueryKey = (userId: string | null | undefined): readonly unknown[] => [
  "admin",
  "users",
  "detail",
  userId ?? "",
];

/**
 * Queries one user's admin detail when an id is selected.
 *
 * @param userId Reactive user id.
 * @param providedClient Optional client for tests.
 * @returns Vue Query state for the selected user detail.
 */
export const useAdminUserQuery = (
  userId: MaybeRefOrGetter<string | null | undefined>,
  providedClient?: AdminUsersClient,
): UseQueryReturnType<AdminUserDetail, Error> => {
  const client = providedClient ?? useAdminUsersClient();
  const selectedUserId = computed(() => toValue(userId));

  return useQuery({
    queryKey: computed(() => adminUserDetailQueryKey(selectedUserId.value)),
    queryFn: () => client.getUser(selectedUserId.value ?? ""),
    enabled: computed(() => Boolean(selectedUserId.value)),
    staleTime: STALE_TIME.ACTIVE,
  });
};
