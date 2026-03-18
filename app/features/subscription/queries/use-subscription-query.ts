import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import {
  useSubscriptionClient,
  type SubscriptionClient,
} from "~/features/subscription/api/subscription.client";
import type { Subscription } from "~/features/subscription/model/subscription";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const subscriptionMock: Subscription = {
  id: "mock-subscription-id",
  planSlug: "premium",
  status: "trialing",
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  provider: null,
  providerSubscriptionId: null,
};

/**
 * Vue Query hook for the authenticated user's subscription.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed Subscription data.
 */
export const useSubscriptionQuery = (
  providedClient?: SubscriptionClient,
): UseQueryReturnType<Subscription, Error> => {
  const client = providedClient ?? useSubscriptionClient();

  return useQuery({
    queryKey: ["subscription", "me"] as const,
    queryFn: (): Promise<Subscription> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(subscriptionMock);
      }

      return client.getMySubscription();
    },
  });
};
