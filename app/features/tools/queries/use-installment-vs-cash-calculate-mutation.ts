import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  type InstallmentVsCashClient,
  useInstallmentVsCashClient,
} from "~/features/tools/services/installment-vs-cash.client";
import type { InstallmentVsCashCalculationRequestDto } from "~/features/tools/contracts/installment-vs-cash.dto";
import type { InstallmentVsCashCalculation } from "~/features/tools/model/installment-vs-cash";

/**
 * Vue Query mutation used by the public page to trigger the calculation.
 *
 * @param providedClient Optional injected client for tests.
 * @returns Mutation state for the public calculate action.
 */
export const useInstallmentVsCashCalculateMutation = (
  providedClient?: InstallmentVsCashClient,
): UseMutationReturnType<
  InstallmentVsCashCalculation,
  Error,
  InstallmentVsCashCalculationRequestDto,
  unknown
> => {
  const client = providedClient ?? useInstallmentVsCashClient();

  return useMutation({
    mutationFn: (
      payload: InstallmentVsCashCalculationRequestDto,
    ): Promise<InstallmentVsCashCalculation> => {
      return client.calculate(payload);
    },
  });
};
