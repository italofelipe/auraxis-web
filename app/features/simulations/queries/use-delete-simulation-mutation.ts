import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import { useSimulationClient, type SimulationClient } from "~/features/simulations/api/simulation.client";

/**
 * Vue Query mutation hook for deleting a saved simulation.
 *
 * Invalidates the simulations list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteSimulationMutation = (
  providedClient?: SimulationClient,
): UseMutationReturnType<void, Error, string, unknown> => {
  const client = providedClient ?? useSimulationClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => client.deleteSimulation(id),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });
};
