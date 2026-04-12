import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import {
  useReceivablesClient,
  type ReceivablesClient,
} from "~/features/receivables/services/receivables.client";
import type { RevenueSummary } from "~/features/receivables/model/receivables";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const revenueSummaryMock: RevenueSummary = {
  expectedTotal: 11500,
  receivedTotal: 3500,
  pendingTotal: 8000,
};

/**
 * Vue Query hook for the authenticated user's revenue summary.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed RevenueSummary data.
 */
export const useRevenueSummaryQuery = (
  providedClient?: ReceivablesClient,
): UseQueryReturnType<RevenueSummary, Error> => {
  const client = providedClient ?? useReceivablesClient();

  return useQuery({
    queryKey: ["receivables", "summary"] as const,
    queryFn: (): Promise<RevenueSummary> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(revenueSummaryMock);
      }

      return client.getSummary();
    },
    staleTime: STALE_TIME.ACTIVE,
  });
};
