<script setup lang="ts">
import { NSkeleton } from "naive-ui";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

interface Props {
  feature: FeatureKey;
}

const props = defineProps<Props>();

const { isLoading, data: hasAccessData } = useEntitlementQuery(props.feature);
</script>

<template>
  <div class="paywall-gate">
    <NSkeleton v-if="isLoading" height="120px" :sharp="false" />
    <slot v-else-if="hasAccessData === true" />
    <slot v-else name="locked" />
  </div>
</template>

<style scoped>
.paywall-gate {
  width: 100%;
}
</style>
