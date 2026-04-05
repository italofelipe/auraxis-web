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
import type { BillingCycle, PlanDto, PlanSlug } from "~/features/subscription/contracts/subscription.dto";
import { PRICING } from "~/shared/constants/pricing";

const { t } = useI18n();

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Assinatura",
  pageSubtitle: "Gerencie seu plano Auraxis",
});

useHead({ title: "Assinatura | Auraxis" });

// ── Billing cycle toggle ──────────────────────────────────────────────────────

const billingCycle = ref<BillingCycle>("monthly");

/** Flips the active billing cycle between monthly and annual. */
const toggleCycle = (): void => {
  billingCycle.value = billingCycle.value === "monthly" ? "annual" : "monthly";
};

// ── Plan definitions ──────────────────────────────────────────────────────────

const ALL_PLANS = computed((): PlanDto[] => [
  {
    slug: "free",
    name: t("pages.subscription.plans.free.name"),
    price_monthly: 0,
    price_annual: 0,
    features: [
      { label: t("pages.subscription.plans.features.transactions50"), included: true },
      { label: t("pages.subscription.plans.features.goals1"), included: true },
      { label: t("pages.subscription.plans.features.basicReports"), included: true },
      { label: t("pages.subscription.plans.features.simulations"), included: false },
      { label: t("pages.subscription.plans.features.sharedEntries"), included: false },
      { label: t("pages.subscription.plans.features.prioritySupport"), included: false },
    ],
  },
  {
    slug: "premium",
    name: t("pages.subscription.plans.premium.name"),
    price_monthly: PRICING.MONTHLY_PRICE,
    price_annual: PRICING.ANNUAL_MONTHLY_EQUIVALENT,
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
  if (!subscription.value) { return null; }
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
 * Initiates checkout for the selected plan with the active billing cycle.
 * Redirects to the returned checkout URL on success.
 *
 * @param slug - The selected plan slug.
 */
const onSelectPlan = (slug: string): void => {
  checkoutMutation.mutate(
    { planSlug: slug, billingCycle: billingCycle.value },
    {
      onSuccess: (checkoutUrl: string) => {
        window.location.href = checkoutUrl;
      },
    },
  );
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
          <div class="subscription-page__plans-header">
            <NText tag="h3" class="subscription-page__plans-title">
              {{ $t('pages.subscription.choosePlan') }}
            </NText>

            <!-- Billing cycle toggle -->
            <div class="subscription-page__toggle-wrap">
              <span
                class="subscription-page__toggle-label"
                :class="{ 'subscription-page__toggle-label--active': billingCycle === 'monthly' }"
              >
                {{ $t('pages.subscription.billing.monthly') }}
              </span>
              <button
                class="subscription-page__toggle"
                :aria-checked="billingCycle === 'annual'"
                :aria-label="$t('pages.subscription.billing.toggleAriaLabel')"
                role="switch"
                type="button"
                @click="toggleCycle"
              >
                <span
                  class="subscription-page__toggle-knob"
                  :class="{ 'subscription-page__toggle-knob--annual': billingCycle === 'annual' }"
                />
              </button>
              <span
                class="subscription-page__toggle-label"
                :class="{ 'subscription-page__toggle-label--active': billingCycle === 'annual' }"
              >
                {{ $t('pages.subscription.billing.annual') }}
              </span>
            </div>
          </div>

          <NGrid :x-gap="16" :y-gap="16" :cols="2" responsive="screen" item-responsive>
            <NGridItem
              v-for="plan in ALL_PLANS"
              :key="plan.slug"
              :span="2"
              :s="1"
            >
              <PlanCard
                :plan="plan"
                :is-current="plan.slug === subscription?.planSlug"
                :billing-cycle="billingCycle"
                :loading="checkoutMutation.isPending.value && checkoutMutation.variables.value?.planSlug === plan.slug"
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

.subscription-page__plans-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.subscription-page__plans-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ── Billing toggle (compact variant) ────────────────────────────────────── */
.subscription-page__toggle-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.subscription-page__toggle-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  transition: color 0.15s ease;
}

.subscription-page__toggle-label--active {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.subscription-page__toggle {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--color-neutral-300, #ccc);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}

.subscription-page__toggle[aria-checked="true"] {
  background: var(--color-brand-500);
}

.subscription-page__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: var(--radius-full);
  transition: transform 0.2s ease;
  box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
}

.subscription-page__toggle-knob--annual {
  transform: translateX(16px);
}
</style>
