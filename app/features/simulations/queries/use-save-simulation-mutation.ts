import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  useSimulationClient,
  type SimulationClient,
} from "~/features/simulations/api/simulation.client";
import type { Simulation, SaveSimulationPayload } from "~/features/simulations/model/simulation";

/**
 * Vue Query mutation hook for saving a simulation.
 *
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for saving a simulation.
 */
export const useSaveSimulationMutation = (
  providedClient?: SimulationClient,
): UseMutationReturnType<Simulation, Error, SaveSimulationPayload, unknown> => {
  const client = providedClient ?? useSimulationClient();

  return useMutation({
    mutationFn: (payload: SaveSimulationPayload): Promise<Simulation> => {
      return client.saveSimulation(payload);
    },
  });
};
