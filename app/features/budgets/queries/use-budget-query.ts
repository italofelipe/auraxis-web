import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import { MOCK_BUDGETS } from "~/features/budgets/mock/budget.mock";
import { useBudgetClient, type BudgetClient } from "~/features/budgets/services/budget.client";

/**
 * Vue Query hook for fetching a single budget by ID with spent calculation.
 *
 * @param id - Budget ID (reactive).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed BudgetDto.
 */
export const useBudgetQuery = (
  id: MaybeRef<string>,
  providedClient?: BudgetClient,
): UseQueryReturnType<BudgetDto, Error> => {
  const client = providedClient ?? useBudgetClient();

  return useQuery({
    queryKey: ["budgets", "detail", id] as const,
    queryFn: (): Promise<BudgetDto> => {
      const resolvedId = typeof id === "string" ? id : id.value;
      if (isMockDataEnabled()) {
        const found = MOCK_BUDGETS.find((b) => b.id === resolvedId);
        if (found) {return Promise.resolve(found);}
        return Promise.reject(new Error("Budget not found in mock data"));
      }

      return client.getBudget(resolvedId);
    },
    staleTime: STALE_TIME.STABLE,
  });
};
