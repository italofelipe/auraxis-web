<script setup lang="ts">
import { watch } from "vue";

import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

/**
 * Props for UiPaywallGate.
 */
interface Props {
  /** Feature key to check against the entitlements API. */
  feature: FeatureKey;
}

const props = defineProps<Props>();
const analytics = useAnalytics();

const { isLoading, data: hasAccessData } = useEntitlementQuery(props.feature);

// #524 — emit `paywall_shown` whenever the gate renders the locked branch
// for a feature. The watcher fires on every (feature, locked) transition
// — PostHog sees one event per distinct gate render, which matches the
// funnel definition (`paywall_shown → upgrade_clicked → upgrade_completed`).
watch(
  [(): FeatureKey => props.feature, hasAccessData, isLoading],
  ([feature, hasAccess, loading]): void => {
    if (loading) {
      return;
    }
    if (hasAccess === false) {
      analytics.capture("paywall_shown", {
        feature,
        gate: "ui-paywall-gate",
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="ui-paywall-gate">
    <BaseSkeleton v-if="isLoading" height="120px" />
    <slot v-else-if="hasAccessData === true" />
    <slot v-else name="locked" />
  </div>
</template>

<style scoped>
.ui-paywall-gate {
  width: 100%;
}
</style>
