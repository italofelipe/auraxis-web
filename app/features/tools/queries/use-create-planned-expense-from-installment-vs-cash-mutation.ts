import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  type InstallmentVsCashClient,
  useInstallmentVsCashClient,
} from "~/features/tools/api/installment-vs-cash.client";
import type {
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashPlannedExpenseBridgeResponse,
} from "~/features/tools/model/installment-vs-cash";

interface CreatePlannedExpenseVariables {
  simulationId: string;
  payload: CreateInstallmentVsCashPlannedExpensePayload;
}

/**
 * Mutation hook for the premium "planned expense" bridge action.
 *
 * @param providedClient Optional injected client for tests.
 * @returns Mutation state for the planned-expense bridge.
 */
export const useCreatePlannedExpenseFromInstallmentVsCashMutation = (
  providedClient?: InstallmentVsCashClient,
): UseMutationReturnType<
  InstallmentVsCashPlannedExpenseBridgeResponse,
  Error,
  CreatePlannedExpenseVariables,
  unknown
> => {
  const client = providedClient ?? useInstallmentVsCashClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      simulationId,
      payload,
    }: CreatePlannedExpenseVariables): Promise<InstallmentVsCashPlannedExpenseBridgeResponse> => {
      return client.createPlannedExpenseFromSimulation(simulationId, payload);
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });
};
