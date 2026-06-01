import {
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";

import {
  useSimulationQuotaClient,
  type SimulationQuotaClient,
} from "~/features/simulations/services/simulation-quota.client";
import type { SimulationQuota } from "~/features/simulations/model/simulation-quota";
import { SIMULATION_QUOTA_QUERY_KEY } from "~/features/simulations/queries/use-simulation-quota-query";

/**
 * Mutation que consome 1 simulação da quota (#566). Em sucesso, atualiza o
 * cache da query de quota com o snapshot retornado (fonte de verdade no server).
 *
 * @param providedClient Client opcional injetado para testes unitários.
 * @returns Estado Vue Query da mutation com a quota atualizada.
 */
export const useConsumeSimulationQuotaMutation = (
  providedClient?: SimulationQuotaClient,
): UseMutationReturnType<SimulationQuota, Error, void, unknown> => {
  const client = providedClient ?? useSimulationQuotaClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<SimulationQuota> => client.consume(),
    onSuccess: (quota: SimulationQuota): void => {
      queryClient.setQueryData(SIMULATION_QUOTA_QUERY_KEY, quota);
    },
  });
};
