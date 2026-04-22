<script setup lang="ts">
import { computed } from "vue";

import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";

const { data: subscription } = useSubscriptionQuery();

const PREMIUM_SLUGS = new Set(["premium", "pro"]);
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const isPremiumActive = computed((): boolean => {
  const sub = subscription.value;
  if (!sub) { return false; }
  return PREMIUM_SLUGS.has(sub.planSlug) && ACTIVE_STATUSES.has(sub.status);
});
</script>

<template>
  <PremiumBadge v-if="isPremiumActive" />
</template>
