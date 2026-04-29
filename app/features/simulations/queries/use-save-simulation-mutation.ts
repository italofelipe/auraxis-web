import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useSimulationClient,
  type SimulationClient,
} from "~/features/simulations/services/simulation.client";
import type {
  SaveSimulationPayload,
  Simulation,
} from "~/features/simulations/model/simulation";

/**
 * Vue Query mutation hook for saving a simulation through the canonical
 * generic `/simulations` endpoint (DEC-196).
 *
 * Errors propagate as mutation error state — no silent catch. On success
 * the simulations list query is invalidated so freshly saved simulations
 * appear immediately on `/simulations`.
 * @param providedClient
 * @returns The computed value.
   */
export const useSaveSimulationMutation = (
  providedClient?: SimulationClient,
): UseMutationReturnType<Simulation, Error, SaveSimulationPayload, unknown> => {
  const client = providedClient ?? useSimulationClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveSimulationPayload): Promise<Simulation> => {
      return client.saveSimulation(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });
};
