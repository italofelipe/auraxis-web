<script setup lang="ts">
import { NButton, NCard, NModal, NSkeleton, NSpace } from "naive-ui";

import SubscriptionBadge from "~/features/subscription/components/SubscriptionBadge.vue";
import CheckoutButton from "~/features/subscription/components/CheckoutButton.vue";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useSubscriptionClient } from "~/features/subscription/api/subscription.client";

definePageMeta({ middleware: ["authenticated"] });

const subscriptionQuery = useSubscriptionQuery();

const showCancelModal = ref(false);
const isCanceling = ref(false);
const cancelError = ref<string | null>(null);

/**
 * Formats an ISO timestamp into a human-readable PT-BR date label.
 *
 * @param iso ISO date string to format.
 * @returns Localized date string or empty string when value is null.
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
 * Returns a human-readable plan name for the given plan slug.
 *
 * @param slug Plan slug from the API.
 * @returns Display name for the plan.
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
    <header class="assinatura-page__header">
      <h1>Assinatura</h1>
      <p class="assinatura-page__subtitle">
        Gerencie seu plano e informações de cobrança.
      </p>
    </header>

    <!-- Loading state -->
    <NSpace v-if="subscriptionQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="140px" :sharp="false" />
    </NSpace>

    <!-- Error state -->
    <UiBaseCard v-else-if="subscriptionQuery.isError.value" title="Erro ao carregar assinatura">
      <p class="assinatura-page__support-copy">
        Não foi possível carregar sua assinatura. Tente novamente.
      </p>
    </UiBaseCard>

    <!-- Loaded state -->
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

    <!-- Cancellation confirmation modal -->
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
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  max-width: 640px;
}

.assinatura-page__header {
  margin-bottom: var(--space-2, 8px);
}

.assinatura-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.assinatura-page__card {
  display: grid;
  gap: var(--space-3, 12px);
}

.assinatura-page__plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2, 8px);
}

.assinatura-page__label {
  margin: 0 0 var(--space-1, 4px);
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.assinatura-page__plan-name {
  margin: 0;
  font-size: var(--font-size-heading-sm, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
}

.assinatura-page__detail {
  display: grid;
  gap: 2px;
}

.assinatura-page__detail p:last-child {
  margin: 0;
  font-weight: var(--font-weight-semibold, 600);
}

.assinatura-page__support-copy {
  margin: 0 0 var(--space-2, 8px);
  color: var(--color-neutral-700, #444);
}

.assinatura-page__upgrade {
  padding-top: var(--space-2, 8px);
  border-top: 1px solid var(--color-outline-soft);
}

.assinatura-page__cancel {
  padding-top: var(--space-2, 8px);
}

.assinatura-page__cancel-error {
  margin: 0;
  font-size: var(--font-size-body-sm, 0.75rem);
  color: #b24526;
}
</style>
