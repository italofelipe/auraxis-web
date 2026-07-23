import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminUserList, AdminUsersFilters } from "~/features/admin/users/model/admin-user";
import {
  type AdminUsersClient,
  useAdminUsersClient,
} from "~/features/admin/users/services/admin-users.client";

/** Root cache key for admin user data. */
export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

/**
 * Builds the cache key for the admin users list.
 *
 * @param filters Search and pagination filters.
 * @returns Stable Vue Query key.
 */
export const adminUsersListQueryKey = (filters: AdminUsersFilters): readonly unknown[] => [
  ...ADMIN_USERS_QUERY_KEY,
  "list",
  {
    search: filters.search ?? "",
    cursor: filters.cursor ?? "",
    limit: filters.limit ?? 25,
    status: filters.status ?? "",
    source: filters.source ?? "",
    premium: filters.premium ?? null,
  },
];

/**
 * Queries admin users using reactive search and pagination filters.
 *
 * @param filters Reactive filters for the list endpoint.
 * @param providedClient Optional client for tests.
 * @returns Vue Query state for the user list.
 */
export const useAdminUsersQuery = (
  filters: MaybeRefOrGetter<AdminUsersFilters>,
  providedClient?: AdminUsersClient,
): UseQueryReturnType<AdminUserList, Error> => {
  const client = providedClient ?? useAdminUsersClient();
  const normalizedFilters = computed(() => toValue(filters));

  return useQuery({
    queryKey: computed(() => adminUsersListQueryKey(normalizedFilters.value)),
    queryFn: () => client.listUsers(normalizedFilters.value),
    staleTime: STALE_TIME.ACTIVE,
  });
};
