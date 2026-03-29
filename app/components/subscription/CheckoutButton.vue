<script setup lang="ts">
import { NButton } from "naive-ui";

import { useSubscriptionClient } from "~/features/subscription/services/subscription.client";

interface Props {
  /** Plan slug to initiate checkout for. */
  planSlug: string;
  /** Optional label override for the button. */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Assinar",
});

const isLoading = ref(false);
const error = ref<string | null>(null);

/**
 * Initiates the checkout flow for the bound plan slug.
 *
 * Calls createCheckout, then redirects the browser to the returned URL.
 * Sets loading state during the request and surfaces errors inline.
 */
const handleCheckout = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;

  try {
    const client = useSubscriptionClient();
    const checkoutUrl = await client.createCheckout(props.planSlug);
    window.location.href = checkoutUrl;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Erro ao iniciar checkout.";
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
      {{ label }}
    </NButton>
    <p v-if="error" class="checkout-button__error">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.checkout-button {
  display: grid;
  gap: var(--space-1, 4px);
}

.checkout-button__error {
  margin: 0;
  font-size: var(--font-size-body-sm, 0.75rem);
  color: #b24526;
}
</style>
