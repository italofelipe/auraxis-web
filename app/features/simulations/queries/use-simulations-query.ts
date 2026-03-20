import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import {
  useSimulationClient,
  type SimulationClient,
} from "~/features/simulations/api/simulation.client";
import type { Simulation } from "~/features/simulations/model/simulation";

/**
 * Vue Query hook for listing the authenticated user's simulations.
 *
 * Errors propagate as query error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed Simulation array.
 */
export const useSimulationsQuery = (
  providedClient?: SimulationClient,
): UseQueryReturnType<Simulation[], Error> => {
  const client = providedClient ?? useSimulationClient();

  return useQuery({
    queryKey: ["simulations"] as const,
    queryFn: (): Promise<Simulation[]> => {
      return client.listSimulations();
    },
  });
};
