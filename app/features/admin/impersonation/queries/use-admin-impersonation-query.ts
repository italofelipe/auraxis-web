import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminImpersonationSearchResult } from "~/features/admin/impersonation/model/admin-impersonation";
import {
  type AdminImpersonationClient,
  useAdminImpersonationClient,
} from "~/features/admin/impersonation/services/admin-impersonation.client";

/**
 * Searches users for the read-only impersonation flow.
 *
 * @param search Reactive search text.
 * @param providedClient Optional client override for tests.
 * @returns Vue Query result for matching users.
 */
export const useAdminImpersonationSearchQuery = (
  search: MaybeRefOrGetter<string>,
  providedClient?: AdminImpersonationClient,
): UseQueryReturnType<AdminImpersonationSearchResult, Error> => {
  const client = providedClient ?? useAdminImpersonationClient();
  const normalizedSearch = computed(() => toValue(search).trim());

  return useQuery({
    queryKey: computed(() => ["admin", "impersonation", "users", normalizedSearch.value]),
    queryFn: () => client.searchUsers(normalizedSearch.value),
    enabled: computed(() => normalizedSearch.value.length >= 2),
    staleTime: STALE_TIME.ACTIVE,
  });
};
