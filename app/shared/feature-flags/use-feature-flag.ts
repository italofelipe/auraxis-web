import { computed, type ComputedRef, onMounted, ref, type Ref } from "vue";

import { isFeatureEnabled, resolveProviderDecision } from "./service";

/**
 * Synchronous feature flag check against the local catalog.
 *
 * Use this when you only need the local-catalog decision (most common case for
 * SSG pages and tool gates). Returns a stable ComputedRef — no async, no
 * hydration mismatch risk.
 *
 * Priority chain: env override → local catalog status.
 * Provider (Unleash) is NOT consulted — use `useFeatureFlagAsync` for that.
 *
 * @param flagKey Dot-separated flag key, e.g. "web.tools.thirteenth-salary".
 * @returns Reactive boolean — true when the flag is enabled for the current env.
 */
export function useFeatureFlag(flagKey: string): ComputedRef<boolean> {
  return computed(() => isFeatureEnabled(flagKey));
}

/**
 * Async feature flag check that also consults the remote provider (Unleash).
 *
 * Starts as the local-catalog value and updates once the provider responds.
 * Safe to use in mounted components — the initial render uses the local value
 * so there is no SSR/hydration mismatch.
 *
 * @param flagKey Dot-separated flag key, e.g. "web.tools.thirteenth-salary".
 * @returns Reactive state object with `enabled` and `isResolving` refs.
 */
export function useFeatureFlagAsync(flagKey: string): {
  enabled: Ref<boolean>;
  isResolving: Ref<boolean>;
} {
  const enabled = ref(isFeatureEnabled(flagKey));
  const isResolving = ref(false);

  onMounted(async () => {
    isResolving.value = true;
    try {
      const providerDecision = await resolveProviderDecision(flagKey);
      if (typeof providerDecision === "boolean") {
        enabled.value = providerDecision;
      }
    } finally {
      isResolving.value = false;
    }
  });

  return { enabled, isResolving };
}
