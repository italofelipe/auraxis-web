import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import { MOCK_BUDGETS } from "~/features/budgets/mock/budget.mock";
import { useBudgetClient, type BudgetClient } from "~/features/budgets/services/budget.client";

/**
 * Vue Query hook for listing the authenticated user's active budgets with spent amounts.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed BudgetDto array.
 */
export const useBudgetsQuery = (
  providedClient?: BudgetClient,
): UseQueryReturnType<BudgetDto[], Error> => {
  const client = providedClient ?? useBudgetClient();

  return useQuery({
    queryKey: ["budgets", "list"] as const,
    queryFn: (): Promise<BudgetDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_BUDGETS);
      }

      return client.listBudgets();
    },
    staleTime: STALE_TIME.STABLE,
  });
};
