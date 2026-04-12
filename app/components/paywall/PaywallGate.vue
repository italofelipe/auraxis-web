<script setup lang="ts">
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
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
    <BaseSkeleton v-if="isLoading" height="120px" />
    <slot v-else-if="hasAccessData === true" />
    <slot v-else name="locked" />
  </div>
</template>

<style scoped>
.paywall-gate {
  width: 100%;
}
</style>
