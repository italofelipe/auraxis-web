import {
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";

import {
  type InstallmentVsCashClient,
  useInstallmentVsCashClient,
} from "~/features/tools/api/installment-vs-cash.client";
import type { InstallmentVsCashSaveRequestDto } from "~/features/tools/contracts/installment-vs-cash.dto";
import type { InstallmentVsCashSavedCalculation } from "~/features/tools/model/installment-vs-cash";

/**
 * Mutation hook used to save the calculation for an authenticated user.
 *
 * @param providedClient Optional injected client for tests.
 * @returns Mutation state for the save action.
 */
export const useSaveInstallmentVsCashMutation = (
  providedClient?: InstallmentVsCashClient,
): UseMutationReturnType<
  InstallmentVsCashSavedCalculation,
  Error,
  InstallmentVsCashSaveRequestDto,
  unknown
> => {
  const client = providedClient ?? useInstallmentVsCashClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: InstallmentVsCashSaveRequestDto,
    ): Promise<InstallmentVsCashSavedCalculation> => {
      return client.save(payload);
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });
};
