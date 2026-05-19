import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminOperationsSummary } from "~/features/admin/operations/model/admin-operations";
import {
  type AdminOperationsClient,
  useAdminOperationsClient,
} from "~/features/admin/operations/services/admin-operations.client";

export const ADMIN_OPERATIONS_SUMMARY_QUERY_KEY = ["admin", "operations", "summary"] as const;

/**
 * Loads the admin operational summary.
 *
 * @param providedClient Optional client override for tests.
 * @returns Vue Query result for operations health data.
 */
export const useAdminOperationsSummaryQuery = (
  providedClient?: AdminOperationsClient,
): UseQueryReturnType<AdminOperationsSummary, Error> => {
  const client = providedClient ?? useAdminOperationsClient();

  return useQuery({
    queryKey: ADMIN_OPERATIONS_SUMMARY_QUERY_KEY,
    queryFn: () => client.getOperationalSummary(),
    staleTime: STALE_TIME.ACTIVE,
  });
};
