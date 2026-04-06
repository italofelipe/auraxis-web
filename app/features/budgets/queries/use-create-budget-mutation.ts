import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import type {
  BudgetDto,
  CreateBudgetPayload,
} from "~/features/budgets/contracts/budget.contracts";
import { useBudgetClient, type BudgetClient } from "~/features/budgets/services/budget.client";

/**
 * Vue Query mutation hook for creating a new budget.
 *
 * Invalidates the budgets list cache on success.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with typed BudgetDto result.
 */
export const useCreateBudgetMutation = (
  providedClient?: BudgetClient,
): UseMutationReturnType<BudgetDto, ApiError, CreateBudgetPayload, unknown> => {
  const client = providedClient ?? useBudgetClient();
  return createApiMutation<BudgetDto, CreateBudgetPayload>(
    (payload) => client.createBudget(payload),
    {
      successMessage: "Orçamento criado com sucesso.",
      invalidates: [["budgets", "list"]],
    },
  );
};
