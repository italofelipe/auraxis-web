import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { STALE_TIME } from "~/core/query/stale-time";
import {
  useEntitlementClient,
  type EntitlementClient,
} from "~/features/paywall/services/entitlement.client";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

/**
 * Vue Query hook to check if the authenticated user has access to a feature.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param featureKey The feature key to check entitlement for.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed boolean access result.
 */
export const useEntitlementQuery = (
  featureKey: FeatureKey,
  providedClient?: EntitlementClient,
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
    staleTime: STALE_TIME.STATIC,
  });
};
