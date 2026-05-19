import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminFeatureFlagList } from "~/features/admin/operations/model/admin-operations";
import {
  type AdminOperationsClient,
  useAdminOperationsClient,
} from "~/features/admin/operations/services/admin-operations.client";

export const ADMIN_FEATURE_FLAGS_QUERY_KEY = ["admin", "feature-flags"] as const;

/**
 * Loads feature flags for the admin operations page.
 *
 * @param providedClient Optional client override for tests.
 * @returns Vue Query result for feature flags.
 */
export const useAdminFeatureFlagsQuery = (
  providedClient?: AdminOperationsClient,
): UseQueryReturnType<AdminFeatureFlagList, Error> => {
  const client = providedClient ?? useAdminOperationsClient();

  return useQuery({
    queryKey: ADMIN_FEATURE_FLAGS_QUERY_KEY,
    queryFn: () => client.listFeatureFlags(),
    staleTime: STALE_TIME.ACTIVE,
  });
};
