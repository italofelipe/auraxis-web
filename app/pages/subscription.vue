<script setup lang="ts">
import { NButton, NCard, NModal, NSkeleton, NSpace } from "naive-ui";

import SubscriptionBadge from "~/features/subscription/components/SubscriptionBadge.vue";
import CheckoutButton from "~/features/subscription/components/CheckoutButton.vue";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useSubscriptionClient } from "~/features/subscription/api/subscription.client";

const { t } = useI18n();

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
    cancelError.value = err instanceof Error ? err.message : t("pages.subscription.cancelError");
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
  <div class="subscription-page">
    <NSpace v-if="subscriptionQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="140px" :sharp="false" />
    </NSpace>

    <UiBaseCard v-else-if="subscriptionQuery.isError.value" :title="t('pages.subscription.errorTitle')">
      <p class="subscription-page__support-copy">
        {{ t('pages.subscription.errorMessage') }}
      </p>
    </UiBaseCard>

    <NCard v-else-if="subscription" class="subscription-page__card">
      <div class="subscription-page__plan-row">
        <div>
          <p class="subscription-page__label">{{ t('pages.subscription.currentPlan') }}</p>
          <p class="subscription-page__plan-name">
            {{ planDisplayName(subscription.planSlug) }}
          </p>
        </div>
        <SubscriptionBadge :status="subscription.status" />
      </div>

      <div v-if="subscription.trialEndsAt" class="subscription-page__detail">
        <p class="subscription-page__label">{{ t('pages.subscription.trialEndsAt') }}</p>
        <p>{{ formatDate(subscription.trialEndsAt) }}</p>
      </div>

      <div v-if="subscription.currentPeriodEnd" class="subscription-page__detail">
        <p class="subscription-page__label">{{ t('pages.subscription.nextBilling') }}</p>
        <p>{{ formatDate(subscription.currentPeriodEnd) }}</p>
      </div>

      <div v-if="subscription.planSlug === 'free'" class="subscription-page__upgrade">
        <p class="subscription-page__support-copy">
          {{ t('pages.subscription.upgradeMessage') }}
        </p>
        <CheckoutButton plan-slug="premium" :label="t('pages.subscription.subscribePremium')" />
      </div>

      <div v-if="isActive" class="subscription-page__cancel">
        <NButton
          type="default"
          size="small"
          @click="showCancelModal = true"
        >
          {{ t('pages.subscription.cancelButton') }}
        </NButton>
      </div>
    </NCard>

    <NModal
      v-model:show="showCancelModal"
      preset="dialog"
      :title="t('pages.subscription.cancelModal.title')"
      :content="t('pages.subscription.cancelModal.content')"
      :positive-text="t('pages.subscription.cancelModal.confirm')"
      :negative-text="t('pages.subscription.cancelModal.keep')"
      :loading="isCanceling"
      @positive-click="handleConfirmCancel"
      @negative-click="showCancelModal = false"
    />

    <p v-if="cancelError" class="subscription-page__cancel-error">
      {{ cancelError }}
    </p>
  </div>
</template>

<style scoped>
.subscription-page {
  display: grid;
  gap: var(--space-4);
  max-width: 640px;
}

.subscription-page__card {
  display: grid;
  gap: var(--space-3);
}

.subscription-page__plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.subscription-page__label {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.subscription-page__plan-name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.subscription-page__detail {
  display: grid;
  gap: 2px;
}

.subscription-page__detail p:last-child {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.subscription-page__support-copy {
  margin: 0 0 var(--space-2);
  color: var(--color-text-secondary);
}

.subscription-page__upgrade {
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}

.subscription-page__cancel {
  padding-top: var(--space-2);
}

.subscription-page__cancel-error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-negative);
}
</style>
