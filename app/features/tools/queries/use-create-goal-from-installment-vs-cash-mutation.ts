import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  type InstallmentVsCashClient,
  useInstallmentVsCashClient,
} from "~/features/tools/api/installment-vs-cash.client";
import type {
  CreateInstallmentVsCashGoalPayload,
  InstallmentVsCashGoalBridgeResponse,
} from "~/features/tools/model/installment-vs-cash";

interface CreateGoalVariables {
  simulationId: string;
  payload: CreateInstallmentVsCashGoalPayload;
}

/**
 * Mutation hook for the premium "add as goal" action.
 *
 * @param providedClient Optional injected client for tests.
 * @returns Mutation state for the goal bridge.
 */
export const useCreateGoalFromInstallmentVsCashMutation = (
  providedClient?: InstallmentVsCashClient,
): UseMutationReturnType<
  InstallmentVsCashGoalBridgeResponse,
  Error,
  CreateGoalVariables,
  unknown
> => {
  const client = providedClient ?? useInstallmentVsCashClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      simulationId,
      payload,
    }: CreateGoalVariables): Promise<InstallmentVsCashGoalBridgeResponse> => {
      return client.createGoalFromSimulation(simulationId, payload);
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });
};
