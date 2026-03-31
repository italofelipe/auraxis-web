import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import type { BillingCycle } from "~/features/subscription/contracts/subscription.dto";
import {
  useSubscriptionClient,
  type SubscriptionClient,
} from "~/features/subscription/services/subscription.client";

/** Variables accepted by the checkout mutation. */
export type CheckoutMutationVariables = {
  planSlug: string;
  billingCycle: BillingCycle;
};

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
): UseMutationReturnType<string, Error, CheckoutMutationVariables, unknown> => {
  const client = providedClient ?? useSubscriptionClient();

  return useMutation({
    mutationFn: ({ planSlug, billingCycle }: CheckoutMutationVariables): Promise<string> => {
      return client.createCheckout(planSlug, billingCycle);
    },
  });
};
