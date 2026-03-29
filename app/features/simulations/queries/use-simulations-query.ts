import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import {
  useSimulationClient,
  type SimulationClient,
} from "~/features/simulations/api/simulation.client";
import { MOCK_SIMULATIONS } from "~/features/simulations/mock/simulations.mock";
import { mapToSimulationCardDto } from "~/features/simulations/model/simulation-card.mapper";
import type { SimulationCardDto } from "~/features/simulations/contracts/simulation-card.dto";

/**
 * Vue Query hook for listing the authenticated user's saved simulations.
 *
 * Returns SimulationCardDto objects ready for the SimulationCard component.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed SimulationCardDto array.
 */
export const useSimulationsQuery = (
  providedClient?: SimulationClient,
): UseQueryReturnType<SimulationCardDto[], Error> => {
  const client = providedClient ?? useSimulationClient();

  return useQuery({
    queryKey: ["simulations"] as const,
    queryFn: async (): Promise<SimulationCardDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_SIMULATIONS);
      }

      const simulations = await client.listSimulations();
      return simulations.map(mapToSimulationCardDto);
    },
  });
};
