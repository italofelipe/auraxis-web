import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import { useBudgetClient, type BudgetClient } from "~/features/budgets/services/budget.client";

/**
 * Vue Query mutation hook for deleting a budget by ID.
 *
 * Invalidates the budgets list cache on success.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteBudgetMutation = (
  providedClient?: BudgetClient,
): UseMutationReturnType<undefined, ApiError, string, unknown> => {
  const client = providedClient ?? useBudgetClient();
  return createApiMutation<undefined, string>(
    async (id) => {
      await client.deleteBudget(id);
      return undefined;
    },
    {
      successMessage: "Orçamento removido.",
      invalidates: [["budgets", "list"]],
    },
  );
};
