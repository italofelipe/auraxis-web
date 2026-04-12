<script setup lang="ts">
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

/**
 * Props for UiPaywallGate.
 */
interface Props {
  /** Feature key to check against the entitlements API. */
  feature: FeatureKey;
}

const props = defineProps<Props>();

const { isLoading, data: hasAccessData } = useEntitlementQuery(props.feature);
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
