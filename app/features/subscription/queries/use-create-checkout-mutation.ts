import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  useSubscriptionClient,
  type SubscriptionClient,
} from "~/features/subscription/services/subscription.client";

/**
 * Vue Query mutation hook for creating a checkout session for a given plan.
 *
 * Returns the checkout URL that the caller should redirect the user to.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state that resolves to the checkout URL string.
 */
export const useCreateCheckoutMutation = (
  providedClient?: SubscriptionClient,
): UseMutationReturnType<string, Error, string, unknown> => {
  const client = providedClient ?? useSubscriptionClient();

  return useMutation({
    mutationFn: (planSlug: string): Promise<string> => {
      return client.createCheckout(planSlug);
    },
  });
};
