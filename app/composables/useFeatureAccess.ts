import { computed, type Ref } from "vue";

import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

interface FeatureAccessResult {
  hasAccess: Ref<boolean>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
}

/**
 * Composable facade for checking whether the authenticated user has access
 * to a given feature.
 *
 * @param feature The feature key to check.
 * @returns Reactive access state derived from the entitlements query.
 */
export function useFeatureAccess(feature: FeatureKey): FeatureAccessResult {
  const query = useEntitlementQuery(feature);

  const hasAccess = computed<boolean>(() => query.data.value === true);
  const isLoading = computed<boolean>(() => query.isLoading.value);
  const isError = computed<boolean>(() => query.isError.value);

  return { hasAccess, isLoading, isError };
}
