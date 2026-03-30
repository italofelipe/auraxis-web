<script setup lang="ts">
import {
  NCard,
  NTag,
  NText,
  NButton,
  NAlert,
  NGrid,
  NGridItem,
  NPageHeader,
} from "naive-ui";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useCancelSubscriptionMutation } from "~/features/subscription/queries/use-cancel-subscription-mutation";
import { useCreateCheckoutMutation } from "~/features/subscription/queries/use-create-checkout-mutation";
import type { SubscriptionStatus } from "~/features/subscription/model/subscription";
import type { PlanDto, PlanSlug } from "~/features/subscription/contracts/subscription.dto";

const { t } = useI18n();

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano Auraxis",
});

useHead({ title: "Assinatura | Auraxis" });

const ALL_PLANS = computed((): PlanDto[] => [
  {
    slug: "free",
    name: t("pages.subscription.plans.free.name"),
    price_monthly: 0,
    features: [
      { label: t("pages.subscription.plans.features.transactions50"), included: true },
      { label: t("pages.subscription.plans.features.goals1"), included: true },
      { label: t("pages.subscription.plans.features.basicReports"), included: false },
      { label: t("pages.subscription.plans.features.simulations"), included: false },
      { label: t("pages.subscription.plans.features.sharedEntries"), included: false },
      { label: t("pages.subscription.plans.features.prioritySupport"), included: false },
    ],
  },
  {
    slug: "starter",
    name: t("pages.subscription.plans.starter.name"),
    price_monthly: 29.9,
    features: [
      { label: t("pages.subscription.plans.features.transactions200"), included: true },
      { label: t("pages.subscription.plans.features.goals3"), included: true },
      { label: t("pages.subscription.plans.features.basicReports"), included: true },
      { label: t("pages.subscription.plans.features.simulations"), included: false },
      { label: t("pages.subscription.plans.features.sharedEntries"), included: false },
      { label: t("pages.subscription.plans.features.prioritySupport"), included: false },
    ],
  },
  {
    slug: "pro",
    name: t("pages.subscription.plans.pro.name"),
    price_monthly: 59.9,
    features: [
      { label: t("pages.subscription.plans.features.unlimitedTransactions"), included: true },
      { label: t("pages.subscription.plans.features.unlimitedGoals"), included: true },
      { label: t("pages.subscription.plans.features.advancedReports"), included: true },
      { label: t("pages.subscription.plans.features.simulations"), included: true },
      { label: t("pages.subscription.plans.features.sharedEntries"), included: true },
      { label: t("pages.subscription.plans.features.prioritySupport"), included: false },
    ],
  },
  {
    slug: "premium",
    name: t("pages.subscription.plans.premium.name"),
    price_monthly: 99.9,
    features: [
      { label: t("pages.subscription.plans.features.unlimitedTransactions"), included: true },
      { label: t("pages.subscription.plans.features.unlimitedGoals"), included: true },
      { label: t("pages.subscription.plans.features.advancedReports"), included: true },
      { label: t("pages.subscription.plans.features.simulations"), included: true },
      { label: t("pages.subscription.plans.features.sharedEntries"), included: true },
      { label: t("pages.subscription.plans.features.prioritySupport"), included: true },
    ],
  },
]);

const { data: subscription, isLoading, isError } = useSubscriptionQuery();
const cancelMutation = useCancelSubscriptionMutation();
const checkoutMutation = useCreateCheckoutMutation();

const currentPlan = computed<PlanDto | null>(() => {
  if (!subscription.value) {return null;}
  return ALL_PLANS.value.find((p) => p.slug === (subscription.value!.planSlug as PlanSlug)) ?? null;
});

const status = computed<SubscriptionStatus | "none">(() => subscription.value?.status ?? "none");

/**
 * Returns a human-readable label for a subscription status.
 *
 * @param s - The subscription status value.
 * @returns Localised label string.
 */
const statusLabel = (s: SubscriptionStatus | "none"): string => {
  const map: Record<SubscriptionStatus | "none", string> = {
    active: t("pages.subscription.status.active"),
    canceled: t("pages.subscription.status.canceled"),
    past_due: t("pages.subscription.status.pastDue"),
    trialing: t("pages.subscription.status.trialing"),
    none: t("pages.subscription.status.none"),
  };
  return map[s];
};

/**
 * Resolves the NaiveUI tag type for a given subscription status.
 *
 * @param s - The subscription status value.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  s: SubscriptionStatus | "none",
): "success" | "error" | "warning" | "info" | "default" => {
  const map: Record<SubscriptionStatus | "none", "success" | "error" | "warning" | "info" | "default"> = {
    active: "success",
    canceled: "error",
    past_due: "warning",
    trialing: "info",
    none: "default",
  };
  return map[s];
};

/**
 * Formats an ISO date string to a localised PT-BR short date.
 *
 * @param value - ISO date string.
 * @returns Formatted date string like "31/12/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const showCancelButton = computed(
  () => status.value === "active" || status.value === "trialing",
);

const showWarningAlert = computed(
  () => status.value === "past_due" || status.value === "canceled",
);

const warningAlertMessage = computed((): string => {
  if (status.value === "past_due") {
    return t("pages.subscription.pastDueMessage");
  }
  return t("pages.subscription.canceledMessage");
});

/** Cancels the active subscription. */
const onCancelSubscription = (): void => {
  cancelMutation.mutate();
};

/**
 * Initiates checkout for the selected plan.
 * Redirects to the returned checkout URL on success.
 *
 * @param slug - The selected plan slug.
 */
const onSelectPlan = (slug: string): void => {
  checkoutMutation.mutate(slug, {
    onSuccess: (checkoutUrl: string) => {
      window.location.href = checkoutUrl;
    },
  });
};
</script>

<template>
  <div class="subscription-page">
    <NPageHeader
      :title="$t('pages.subscription.title')"
      :subtitle="$t('pages.subscription.subtitle')"
    />

    <UiInlineError
      v-if="isError"
      :title="$t('pages.subscription.loadError')"
      :message="$t('pages.subscription.loadErrorMessage')"
    />

    <template v-else>
      <UiPageLoader v-if="isLoading" :rows="3" :with-title="true" />

      <template v-else>
        <NAlert
          v-if="showWarningAlert"
          type="warning"
          :title="status === 'past_due' ? $t('pages.subscription.pastDueTitle') : $t('pages.subscription.canceledTitle')"
          class="subscription-page__alert"
        >
          {{ warningAlertMessage }}
        </NAlert>

        <NCard v-if="subscription" :bordered="true" class="subscription-page__status-card">
          <div class="subscription-page__status-row">
            <div class="subscription-page__status-info">
              <div class="subscription-page__status-header">
                <NText strong class="subscription-page__plan-name">
                  {{ currentPlan?.name ?? subscription.planSlug }}
                </NText>
                <NTag :type="statusTagType(status)" size="small" :bordered="false">
                  {{ statusLabel(status) }}
                </NTag>
              </div>
              <NText
                v-if="subscription.currentPeriodEnd"
                class="subscription-page__period-end"
                depth="3"
              >
                {{ $t('pages.subscription.nextBilling') }} {{ formatDate(subscription.currentPeriodEnd) }}
              </NText>
            </div>
            <NButton
              v-if="showCancelButton"
              type="error"
              size="small"
              quaternary
              :loading="cancelMutation.isPending.value"
              @click="onCancelSubscription"
            >
              {{ $t('pages.subscription.cancelSubscription') }}
            </NButton>
          </div>
        </NCard>

        <div class="subscription-page__plans-section">
          <NText tag="h3" class="subscription-page__plans-title">
            {{ $t('pages.subscription.choosePlan') }}
          </NText>
          <NGrid :x-gap="16" :y-gap="16" :cols="4" responsive="screen" item-responsive>
            <NGridItem
              v-for="plan in ALL_PLANS"
              :key="plan.slug"
              :span="4"
              :xs="4"
              :s="2"
              :m="2"
              :l="1"
            >
              <PlanCard
                :plan="plan"
                :is-current="plan.slug === subscription?.planSlug"
                :loading="checkoutMutation.isPending.value && checkoutMutation.variables.value === plan.slug"
                @select="onSelectPlan"
              />
            </NGridItem>
          </NGrid>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.subscription-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.subscription-page__alert {
  border-radius: var(--radius-md);
}

.subscription-page__status-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.subscription-page__status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subscription-page__status-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.subscription-page__plan-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.subscription-page__period-end {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.subscription-page__plans-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.subscription-page__plans-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
</style>
