<script setup lang="ts">
import { Info, AlertTriangle, XCircle } from "lucide-vue-next";
import { NButton } from "naive-ui";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";

const { t } = useI18n();

const { data: subscription } = useSubscriptionQuery();

const isTrialing = computed(() => subscription.value?.status === "trialing");
const isPastDue = computed(() => subscription.value?.status === "past_due");
const isCanceled = computed(() => subscription.value?.status === "canceled");
const isVisible = computed(() => isTrialing.value || isPastDue.value || isCanceled.value);

const message = computed((): string => {
  if (isTrialing.value) { return t("billing.banner.trialingMessage"); }
  if (isPastDue.value) { return t("billing.banner.pastDueMessage"); }
  if (isCanceled.value) { return t("billing.banner.canceledMessage"); }
  return "";
});

const ctaLabel = computed((): string => {
  if (isTrialing.value) { return t("billing.banner.ctaUpgrade"); }
  return t("billing.banner.cta");
});

const ctaHref = computed((): string => {
  if (isTrialing.value) { return "/plans"; }
  return "/subscription";
});

const icon = computed(() => {
  if (isTrialing.value) { return Info; }
  if (isPastDue.value) { return AlertTriangle; }
  return XCircle;
});

const variant = computed((): "info" | "warning" | "error" => {
  if (isTrialing.value) { return "info"; }
  if (isPastDue.value) { return "warning"; }
  return "error";
});
</script>

<template>
  <div
    v-if="isVisible"
    class="billing-banner"
    :class="`billing-banner--${variant}`"
    role="alert"
    data-testid="billing-status-banner"
  >
    <component :is="icon" class="billing-banner__icon" :size="16" />
    <p class="billing-banner__message">{{ message }}</p>
    <NButton
      size="small"
      :type="variant === 'info' ? 'primary' : variant"
      tag="a"
      :href="ctaHref"
    >
      {{ ctaLabel }}
    </NButton>
  </div>
</template>

<style scoped>
.billing-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
}

.billing-banner--info {
  background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-brand-500) 25%, transparent);
  color: color-mix(in srgb, var(--color-brand-600) 90%, var(--color-text-primary));
}

.billing-banner--warning {
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent);
  color: color-mix(in srgb, var(--color-warning) 80%, var(--color-text-primary));
}

.billing-banner--error {
  background: color-mix(in srgb, var(--color-negative) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-negative) 30%, transparent);
  color: color-mix(in srgb, var(--color-negative) 80%, var(--color-text-primary));
}

.billing-banner__icon {
  flex-shrink: 0;
}

.billing-banner__message {
  margin: 0;
  flex: 1 1 auto;
}
</style>
