import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useSubscriptionClient,
  type SubscriptionClient,
} from "~/features/subscription/services/subscription.client";

/**
 * Vue Query mutation hook for cancelling the authenticated user's subscription.
 *
 * Invalidates the subscription query on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state for the cancel operation.
 */
export const useCancelSubscriptionMutation = (
  providedClient?: SubscriptionClient,
): UseMutationReturnType<void, Error, void, unknown> => {
  const client = providedClient ?? useSubscriptionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<void> => {
      return client.cancelSubscription();
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
    },
  });
};
