<script setup lang="ts">
import { NButton, useMessage } from "naive-ui";

import type { BillingCycle } from "~/features/subscription/contracts/subscription.dto";
import { useSubscriptionClient } from "~/features/subscription/services/subscription.client";
import { useApiError } from "~/composables/useApiError";
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

interface Props {
  /** Plan slug to initiate checkout for. */
  planSlug: string;
  /** Billing cycle to send to the checkout endpoint. Defaults to "monthly". */
  billingCycle?: BillingCycle;
  /** Optional label override for the button. */
  label?: string;
  /**
   * Source label attached to the `upgrade_clicked` analytics event so
   * funnel analysis can split clicks by surface (e.g. `plans-page`,
   * `paywall-gate`, `feature-modal`). Defaults to `checkout-button`.
   */
  source?: string;
}

const message = useMessage();
const { getErrorMessage } = useApiError();
const analytics = useAnalytics();

const props = withDefaults(defineProps<Props>(), {
  billingCycle: "monthly",
  label: undefined,
  source: "checkout-button",
});

const isLoading = ref(false);

/**
 * Initiates the checkout flow for the bound plan slug and billing cycle.
 *
 * Calls createCheckout, then redirects the browser to the returned URL.
 * Sets loading state during the request and surfaces errors via toast.
 */
const handleCheckout = async (): Promise<void> => {
  isLoading.value = true;

  // #524 — emit `upgrade_clicked` BEFORE the network request. The browser
  // navigates away on success, so capturing after `await` would race
  // against PostHog's flush.
  analytics.capture("upgrade_clicked", {
    plan_slug: props.planSlug,
    billing_cycle: props.billingCycle,
    source: props.source,
  });

  try {
    const client = useSubscriptionClient();
    const checkoutUrl = await client.createCheckout(props.planSlug, props.billingCycle);
    window.location.href = checkoutUrl;
  } catch (err) {
    message.error(getErrorMessage(err));
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="checkout-button">
    <NButton
      type="primary"
      :loading="isLoading"
      :disabled="isLoading"
      block
      @click="handleCheckout"
    >
      {{ label ?? $t('subscription.checkoutButton.default') }}
    </NButton>
  </div>
</template>

<style scoped>
.checkout-button {
  display: grid;
}
</style>
