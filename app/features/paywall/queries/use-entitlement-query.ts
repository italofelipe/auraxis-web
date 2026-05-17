import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import {
  useEntitlementClient,
  type EntitlementClient,
} from "~/features/paywall/services/entitlement.client";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

interface UseEntitlementQueryOptions {
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Vue Query hook to check if the authenticated user has access to a feature.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param featureKey The feature key to check entitlement for.
 * @param providedClient Optional injected client for unit tests.
 * @param options Optional query controls, including whether the entitlement request is enabled.
 * @returns Vue Query state with typed boolean access result.
 */
export const useEntitlementQuery = (
  featureKey: FeatureKey,
  providedClient?: EntitlementClient,
  options: UseEntitlementQueryOptions = {},
): UseQueryReturnType<boolean, Error> => {
  const client = providedClient ?? useEntitlementClient();

  return useQuery({
    queryKey: ["entitlements", featureKey] as const,
    queryFn: (): Promise<boolean> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(false);
      }

      return client.checkEntitlement(featureKey);
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIME.STATIC,
  });
};
