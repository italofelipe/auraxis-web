import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import { useAlertsClient, type AlertsClient } from "~/features/alerts/api/alerts.client";

/**
 * Vue Query mutation hook for deleting a single alert.
 *
 * Invalidates the alerts list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state.
 */
export const useDeleteAlertMutation = (
  providedClient?: AlertsClient,
): UseMutationReturnType<void, Error, string, unknown> => {
  const client = providedClient ?? useAlertsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => client.deleteAlert(id),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
