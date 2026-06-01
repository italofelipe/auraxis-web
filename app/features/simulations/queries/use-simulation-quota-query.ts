import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useSimulationQuotaClient,
  type SimulationQuotaClient,
} from "~/features/simulations/services/simulation-quota.client";
import type { SimulationQuota } from "~/features/simulations/model/simulation-quota";

export const SIMULATION_QUOTA_QUERY_KEY = ["simulation-quota"] as const;

/**
 * Vue Query hook para o snapshot da quota freemium do simulador (#566).
 *
 * Erros propagam como estado de erro da query — sem catch silencioso.
 *
 * @param providedClient Client opcional injetado para testes unitários.
 * @returns Estado Vue Query com a quota tipada.
 */
export const useSimulationQuotaQuery = (
  providedClient?: SimulationQuotaClient,
): UseQueryReturnType<SimulationQuota, Error> => {
  const client = providedClient ?? useSimulationQuotaClient();

  return useQuery({
    queryKey: SIMULATION_QUOTA_QUERY_KEY,
    queryFn: (): Promise<SimulationQuota> => client.getQuota(),
    staleTime: STALE_TIME.ACTIVE,
  });
};
