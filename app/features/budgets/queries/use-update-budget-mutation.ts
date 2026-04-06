import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import type {
  BudgetDto,
  UpdateBudgetPayload,
} from "~/features/budgets/contracts/budget.contracts";
import { useBudgetClient, type BudgetClient } from "~/features/budgets/services/budget.client";

/**
 * Variables type for the update budget mutation.
 */
export type UpdateBudgetVariables = { readonly id: string } & UpdateBudgetPayload;

/**
 * Vue Query mutation hook for updating an existing budget.
 *
 * Invalidates the budgets list cache on success.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with typed BudgetDto result.
 */
export const useUpdateBudgetMutation = (
  providedClient?: BudgetClient,
): UseMutationReturnType<BudgetDto, ApiError, UpdateBudgetVariables, unknown> => {
  const client = providedClient ?? useBudgetClient();
  return createApiMutation<BudgetDto, UpdateBudgetVariables>(
    ({ id, ...payload }) => client.updateBudget(id, payload),
    {
      successMessage: "Orçamento atualizado com sucesso.",
      invalidates: [["budgets", "list"]],
    },
  );
};
