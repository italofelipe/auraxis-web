<script setup lang="ts">
import { NButton, NCard, NModal, NSkeleton, NSpace } from "naive-ui";

import SubscriptionBadge from "~/features/subscription/components/SubscriptionBadge.vue";
import CheckoutButton from "~/features/subscription/components/CheckoutButton.vue";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useSubscriptionClient } from "~/features/subscription/api/subscription.client";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano e informações de cobrança",
});

const subscriptionQuery = useSubscriptionQuery();

const showCancelModal = ref(false);
const isCanceling = ref(false);
const cancelError = ref<string | null>(null);

/**
 * @param iso ISO date string or null.
 * @returns Localized date string or empty string.
 */
const formatDate = (iso: string | null): string => {
  if (!iso) { return ""; }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
};

/**
 * @param slug Plan slug from the API.
 * @returns Human-readable plan name.
 */
const planDisplayName = (slug: string): string => {
  const names: Record<string, string> = {
    free: "Free",
    premium: "Premium",
  };
  return names[slug] ?? slug;
};

/**
 * Executes subscription cancellation after user confirmation.
 * Closes the modal and refetches query on success.
 */
const handleConfirmCancel = async (): Promise<void> => {
  isCanceling.value = true;
  cancelError.value = null;

  try {
    const client = useSubscriptionClient();
    await client.cancelSubscription();
    showCancelModal.value = false;
    void subscriptionQuery.refetch();
  } catch (err) {
    cancelError.value = err instanceof Error ? err.message : "Erro ao cancelar assinatura.";
  } finally {
    isCanceling.value = false;
  }
};

const subscription = computed(() => subscriptionQuery.data.value);
const isActive = computed(() =>
  subscription.value?.status === "active" || subscription.value?.status === "trialing",
);
</script>

<template>
  <div class="assinatura-page">
    <NSpace v-if="subscriptionQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="140px" :sharp="false" />
    </NSpace>

    <UiBaseCard v-else-if="subscriptionQuery.isError.value" title="Erro ao carregar assinatura">
      <p class="assinatura-page__support-copy">
        Não foi possível carregar sua assinatura. Tente novamente.
      </p>
    </UiBaseCard>

    <NCard v-else-if="subscription" class="assinatura-page__card">
      <div class="assinatura-page__plan-row">
        <div>
          <p class="assinatura-page__label">Plano atual</p>
          <p class="assinatura-page__plan-name">
            {{ planDisplayName(subscription.planSlug) }}
          </p>
        </div>
        <SubscriptionBadge :status="subscription.status" />
      </div>

      <div v-if="subscription.trialEndsAt" class="assinatura-page__detail">
        <p class="assinatura-page__label">Trial encerra em</p>
        <p>{{ formatDate(subscription.trialEndsAt) }}</p>
      </div>

      <div v-if="subscription.currentPeriodEnd" class="assinatura-page__detail">
        <p class="assinatura-page__label">Próxima cobrança</p>
        <p>{{ formatDate(subscription.currentPeriodEnd) }}</p>
      </div>

      <div v-if="subscription.planSlug === 'free'" class="assinatura-page__upgrade">
        <p class="assinatura-page__support-copy">
          Faça upgrade para o plano Premium e desbloqueie todos os recursos.
        </p>
        <CheckoutButton plan-slug="premium" label="Assinar Premium" />
      </div>

      <div v-if="isActive" class="assinatura-page__cancel">
        <NButton
          type="default"
          size="small"
          @click="showCancelModal = true"
        >
          Cancelar assinatura
        </NButton>
      </div>
    </NCard>

    <NModal
      v-model:show="showCancelModal"
      preset="dialog"
      title="Cancelar assinatura"
      content="Tem certeza de que deseja cancelar sua assinatura? Você perderá acesso aos recursos Premium ao final do período atual."
      positive-text="Confirmar cancelamento"
      negative-text="Manter assinatura"
      :loading="isCanceling"
      @positive-click="handleConfirmCancel"
      @negative-click="showCancelModal = false"
    />

    <p v-if="cancelError" class="assinatura-page__cancel-error">
      {{ cancelError }}
    </p>
  </div>
</template>

<style scoped>
.assinatura-page {
  display: grid;
  gap: var(--space-4);
  max-width: 640px;
}

.assinatura-page__card {
  display: grid;
  gap: var(--space-3);
}

.assinatura-page__plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.assinatura-page__label {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.assinatura-page__plan-name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.assinatura-page__detail {
  display: grid;
  gap: 2px;
}

.assinatura-page__detail p:last-child {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.assinatura-page__support-copy {
  margin: 0 0 var(--space-2);
  color: var(--color-text-secondary);
}

.assinatura-page__upgrade {
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}

.assinatura-page__cancel {
  padding-top: var(--space-2);
}

.assinatura-page__cancel-error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-negative);
}
</style>
