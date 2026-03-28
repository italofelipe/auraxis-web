<script setup lang="ts">
import type { PlanDto } from "~/features/subscription/contracts/subscription.dto";

const { t } = useI18n();

const freePlan = computed((): PlanDto => ({
  slug: "free",
  name: "Free",
  price_monthly: 0,
  features: [
    { label: t("pages.plans.free.features.basicSimulations"), included: true },
    { label: t("pages.plans.free.features.portfolioView"), included: true },
  ],
}));

const premiumPlan = computed((): PlanDto => ({
  slug: "premium",
  name: "Premium",
  price_monthly: 97,
  features: [
    { label: t("pages.plans.premium.features.advancedSimulations"), included: true },
    { label: t("pages.plans.premium.features.exportPdf"), included: true },
    { label: t("pages.plans.premium.features.sharedEntries"), included: true },
    { label: t("pages.plans.premium.features.advancedAlerts"), included: true },
  ],
}));
</script>

<template>
  <div class="plans-page">
    <header class="plans-page__header">
      <p class="plans-page__eyebrow">{{ t('pages.plans.eyebrow') }}</p>
      <h1>{{ t('pages.plans.title') }}</h1>
      <p class="plans-page__subtitle">
        {{ t('pages.plans.subtitle') }}
      </p>
    </header>

    <div class="plans-page__grid">
      <PlanCard :plan="freePlan" :is-current="false" />

      <div class="plans-page__premium-col">
        <PlanCard :plan="premiumPlan" :is-current="false" />
        <CheckoutButton plan-slug="premium" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  max-width: 960px;
  margin-inline: auto;
}

.plans-page__header {
  text-align: center;
}

.plans-page__eyebrow {
  margin: 0 0 var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-body-sm);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.plans-page__header h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-lg);
}

.plans-page__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-neutral-700, #444);
}

.plans-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4, 16px);
  align-items: start;
}

.plans-page__premium-col {
  display: grid;
  gap: var(--space-2, 8px);
}
</style>
