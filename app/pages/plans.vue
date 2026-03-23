<script setup lang="ts">
import CheckoutButton from "~/features/subscription/components/CheckoutButton.vue";
import PlanCard from "~/features/subscription/components/PlanCard.vue";

const { t } = useI18n();

const freePlanFeatures = computed(() => [
  t("pages.plans.free.features.basicSimulations"),
  t("pages.plans.free.features.portfolioView"),
]);

const premiumPlanFeatures = computed(() => [
  t("pages.plans.premium.features.advancedSimulations"),
  t("pages.plans.premium.features.exportPdf"),
  t("pages.plans.premium.features.sharedEntries"),
  t("pages.plans.premium.features.advancedAlerts"),
]);
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
      <PlanCard
        plan-slug="free"
        name="Free"
        price-label="Grátis"
        :features="freePlanFeatures"
      />

      <div class="plans-page__premium-col">
        <PlanCard
          plan-slug="premium"
          name="Premium"
          :price-label="t('pages.plans.premium.price')"
          :features="premiumPlanFeatures"
        />
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
