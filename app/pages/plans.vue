<script setup lang="ts">
import type { BillingCycle, PlanDto } from "~/features/subscription/contracts/subscription.dto";
import { useCreateCheckoutMutation } from "~/features/subscription/queries/use-create-checkout-mutation";
import { PRICING } from "~/shared/constants/pricing";

definePageMeta({ layout: "public" });

const { t } = useI18n();

useSeoMeta({
  title: t("pages.plans.meta.title"),
  description: t("pages.plans.meta.description"),
});

// ── Billing cycle toggle ──────────────────────────────────────────────────────

const billingCycle = ref<BillingCycle>("monthly");

/** Flips the active billing cycle between monthly and annual. */
const toggleCycle = (): void => {
  billingCycle.value = billingCycle.value === "monthly" ? "annual" : "monthly";
};

// ── Plan definitions ──────────────────────────────────────────────────────────

const freePlan = computed((): PlanDto => ({
  slug: "free",
  name: t("pages.plans.plans.free.name"),
  price_monthly: 0,
  price_annual: 0,
  features: [
    { label: t("pages.plans.plans.free.features.transactions"), included: true },
    { label: t("pages.plans.plans.free.features.goals"), included: true },
    { label: t("pages.plans.plans.free.features.basicReports"), included: true },
    { label: t("pages.plans.plans.free.features.simulations"), included: false },
    { label: t("pages.plans.plans.free.features.sharedEntries"), included: false },
    { label: t("pages.plans.plans.free.features.support"), included: false },
  ],
}));

const premiumPlan = computed((): PlanDto => ({
  slug: "premium",
  name: t("pages.plans.plans.premium.name"),
  price_monthly: PRICING.MONTHLY_PRICE,
  price_annual: PRICING.ANNUAL_MONTHLY_EQUIVALENT,
  features: [
    { label: t("pages.plans.plans.premium.features.transactions"), included: true },
    { label: t("pages.plans.plans.premium.features.goals"), included: true },
    { label: t("pages.plans.plans.premium.features.advancedReports"), included: true },
    { label: t("pages.plans.plans.premium.features.simulations"), included: true },
    { label: t("pages.plans.plans.premium.features.sharedEntries"), included: true },
    { label: t("pages.plans.plans.premium.features.support"), included: true },
  ],
}));

// ── Checkout ──────────────────────────────────────────────────────────────────

const checkoutMutation = useCreateCheckoutMutation();

/**
 * Initiates checkout for the Pro plan with the active billing cycle.
 * Redirects to the provider checkout URL on success.
 */
const onSubscribePremium = (): void => {
  checkoutMutation.mutate(
    { planSlug: "premium", billingCycle: billingCycle.value },
    {
      onSuccess: (url: string) => {
        window.location.href = url;
      },
    },
  );
};

// ── Annual savings helpers ────────────────────────────────────────────────────

const annualDiscountPercent = computed(() =>
  Math.round(((premiumPlan.value.price_monthly - premiumPlan.value.price_annual) / premiumPlan.value.price_monthly) * 100),
);
</script>

<template>
  <div class="plans-page">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="plans-page__header">
      <p class="plans-page__eyebrow">{{ t('pages.plans.eyebrow') }}</p>
      <h1 class="plans-page__title">{{ t('pages.plans.title') }}</h1>
      <p class="plans-page__subtitle">{{ t('pages.plans.subtitle') }}</p>
    </header>

    <!-- ── Billing cycle toggle ───────────────────────────────────────── -->
    <div class="plans-page__toggle-wrap">
      <span
        class="plans-page__toggle-label"
        :class="{ 'plans-page__toggle-label--active': billingCycle === 'monthly' }"
      >
        {{ t('pages.plans.billing.monthly') }}
      </span>

      <button
        class="plans-page__toggle"
        :aria-label="t('pages.plans.billing.toggleAriaLabel')"
        :aria-checked="billingCycle === 'annual'"
        role="switch"
        type="button"
        @click="toggleCycle"
      >
        <span
          class="plans-page__toggle-knob"
          :class="{ 'plans-page__toggle-knob--annual': billingCycle === 'annual' }"
        />
      </button>

      <span
        class="plans-page__toggle-label"
        :class="{ 'plans-page__toggle-label--active': billingCycle === 'annual' }"
      >
        {{ t('pages.plans.billing.annual') }}
        <span v-if="billingCycle === 'annual'" class="plans-page__save-badge">
          -{{ annualDiscountPercent }}%
        </span>
      </span>
    </div>

    <!-- ── Annual savings callout ─────────────────────────────────────── -->
    <p v-if="billingCycle === 'annual'" class="plans-page__annual-note">
      {{ t('pages.plans.billing.annualNote') }}
    </p>

    <!-- ── Plan grid ──────────────────────────────────────────────────── -->
    <div class="plans-page__grid">
      <!-- Free plan -->
      <PlanCard :plan="freePlan" :is-current="false" :billing-cycle="billingCycle" />

      <!-- Premium plan -->
      <div class="plans-page__premium-col">
        <div class="plans-page__badges">
          <div class="plans-page__popular-badge">
            {{ t('pages.plans.mostPopular') }}
          </div>
          <div class="plans-page__trial-badge">
            {{ t('pages.plans.trialBadge') }}
          </div>
        </div>
        <PlanCard
          :plan="premiumPlan"
          :is-current="false"
          :billing-cycle="billingCycle"
          :loading="checkoutMutation.isPending.value"
          @select="onSubscribePremium"
        />
      </div>
    </div>

    <!-- ── Footnote ───────────────────────────────────────────────────── -->
    <p class="plans-page__footnote">
      {{
        billingCycle === 'annual'
          ? t('pages.plans.billing.footnoteAnnual')
          : t('pages.plans.footnote')
      }}
    </p>
  </div>
</template>

<style scoped>
.plans-page {
  display: grid;
  gap: var(--space-4);
  padding-block: var(--space-6);
  padding-inline: var(--space-4);
  max-width: 860px;
  margin-inline: auto;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.plans-page__header {
  text-align: center;
}

.plans-page__eyebrow {
  margin: 0 0 var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-xs);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.plans-page__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-lg);
}

.plans-page__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* ── Billing toggle ──────────────────────────────────────────────────────── */
.plans-page__toggle-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.plans-page__toggle-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  transition: color 0.15s ease;
}

.plans-page__toggle-label--active {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.plans-page__toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-neutral-300, #ccc);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}

.plans-page__toggle[aria-checked="true"] {
  background: var(--color-brand-500);
}

.plans-page__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: var(--radius-full);
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.plans-page__toggle-knob--annual {
  transform: translateX(20px);
}

.plans-page__save-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.plans-page__annual-note {
  text-align: center;
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

/* ── Plan grid ───────────────────────────────────────────────────────────── */
.plans-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.plans-page__premium-col {
  display: grid;
  gap: 0;
}

.plans-page__badges {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.plans-page__popular-badge {
  background: var(--color-brand-500);
  /* dark text on amber: #ffbe4d bg gives ~11.9:1 vs #000, WCAG AA ✓ */
  color: #1a0700;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md) 0 0 0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.plans-page__trial-badge {
  background: var(--color-success);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  padding: var(--space-1) var(--space-2);
  border-radius: 0 var(--radius-md) 0 0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Footnote ────────────────────────────────────────────────────────────── */
.plans-page__footnote {
  margin: 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
