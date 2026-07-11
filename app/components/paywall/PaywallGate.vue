<script setup lang="ts">
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";
import { useFeatureFlag } from "~/shared/feature-flags";

interface Props {
  feature: FeatureKey;
}

const props = defineProps<Props>();

// #1115 — kill-switch global do paywall (ver UiPaywallGate).
const paywallEnabled = useFeatureFlag("web.premium.paywall-enabled");

const { isLoading, data: hasAccessData } = useEntitlementQuery(props.feature);
</script>

<template>
  <div class="paywall-gate">
    <slot v-if="!paywallEnabled" />
    <BaseSkeleton v-else-if="isLoading" height="120px" />
    <slot v-else-if="hasAccessData === true" />
    <slot v-else name="locked">
      <UiUpgradePrompt />
    </slot>
  </div>
</template>

<style scoped>
.paywall-gate {
  width: 100%;
}
</style>
