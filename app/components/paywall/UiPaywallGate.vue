<script setup lang="ts">
import { watch } from "vue";

import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { useFeatureFlag } from "~/shared/feature-flags";

/**
 * Props for UiPaywallGate.
 */
interface Props {
  /** Feature key to check against the entitlements API. */
  feature: FeatureKey;
}

const props = defineProps<Props>();
const analytics = useAnalytics();

// #1115 — kill-switch global do paywall: desligado, o gate rende o conteúdo
// aberto (sem lock, sem upsell, sem evento de funil).
const paywallEnabled = useFeatureFlag("web.premium.paywall-enabled");

const { isLoading, data: hasAccessData } = useEntitlementQuery(props.feature);

// #524 — emit `paywall_shown` whenever the gate renders the locked branch
// for a feature. The watcher fires on every (feature, locked) transition
// — PostHog sees one event per distinct gate render, which matches the
// funnel definition (`paywall_shown → upgrade_clicked → upgrade_completed`).
watch(
  [(): FeatureKey => props.feature, hasAccessData, isLoading, paywallEnabled],
  ([feature, hasAccess, loading, gateEnabled]): void => {
    if (!gateEnabled || loading) {
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
    <slot v-if="!paywallEnabled" />
    <BaseSkeleton v-else-if="isLoading" height="120px" />
    <slot v-else-if="hasAccessData === true" />
    <slot v-else name="locked" />
  </div>
</template>

<style scoped>
.ui-paywall-gate {
  width: 100%;
}
</style>
