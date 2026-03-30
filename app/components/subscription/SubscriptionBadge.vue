<script setup lang="ts">
import { NTag } from "naive-ui";

import type { SubscriptionStatus } from "~/features/subscription/model/subscription";

interface Props {
  /** Current subscription status to display. */
  status: SubscriptionStatus;
}

const { t } = useI18n();

const props = defineProps<Props>();

type NTagType = "default" | "success" | "warning" | "error" | "info" | "primary";

/**
 * Resolves the NaiveUI tag type for each subscription status.
 *
 * @returns NaiveUI tag type string.
 */
const tagType = computed((): NTagType => {
  const map: Record<SubscriptionStatus, NTagType> = {
    active: "success",
    trialing: "info",
    past_due: "warning",
    canceled: "default",
  };
  return map[props.status];
});

/**
 * Returns the human-readable label for the given subscription status.
 *
 * @returns PT-BR label string.
 */
const statusLabel = computed((): string => {
  const map: Record<SubscriptionStatus, string> = {
    active: t("subscription.badge.active"),
    trialing: t("subscription.badge.trialing"),
    past_due: t("subscription.badge.pastDue"),
    canceled: t("subscription.badge.canceled"),
  };
  return map[props.status];
});
</script>

<template>
  <NTag :type="tagType" size="medium">
    {{ statusLabel }}
  </NTag>
</template>
