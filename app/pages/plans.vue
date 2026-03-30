<script setup lang="ts">
import { NButton } from "naive-ui";
import type { PlanDto, PlanSlug } from "~/features/subscription/contracts/subscription.dto";
import { useSubscriptionClient } from "~/features/subscription/services/subscription.client";

const { t } = useI18n();

useSeoMeta({
  title: t("pages.plans.meta.title"),
  description: t("pages.plans.meta.description"),
});

// ── Plan definitions ──────────────────────────────────────────────────────────
const plans = computed((): PlanDto[] => [
  {
    slug: "free" as PlanSlug,
    name: t("pages.plans.plans.free.name"),
    price_monthly: 0,
    features: [
      { label: t("pages.plans.plans.free.features.transactions"), included: true },
      { label: t("pages.plans.plans.free.features.goals"), included: true },
      { label: t("pages.plans.plans.free.features.basicReports"), included: true },
      { label: t("pages.plans.plans.free.features.simulations"), included: false },
      { label: t("pages.plans.plans.free.features.sharedEntries"), included: false },
      { label: t("pages.plans.plans.free.features.support"), included: false },
    ],
  },
  {
    slug: "starter" as PlanSlug,
    name: t("pages.plans.plans.starter.name"),
    price_monthly: 19.9,
    features: [
      { label: t("pages.plans.plans.starter.features.transactions"), included: true },
      { label: t("pages.plans.plans.starter.features.goals"), included: true },
      { label: t("pages.plans.plans.starter.features.advancedReports"), included: true },
      { label: t("pages.plans.plans.starter.features.simulations"), included: true },
      { label: t("pages.plans.plans.starter.features.sharedEntries"), included: false },
      { label: t("pages.plans.plans.starter.features.support"), included: false },
    ],
  },
  {
    slug: "pro" as PlanSlug,
    name: t("pages.plans.plans.pro.name"),
    price_monthly: 39.9,
    features: [
      { label: t("pages.plans.plans.pro.features.transactions"), included: true },
      { label: t("pages.plans.plans.pro.features.goals"), included: true },
      { label: t("pages.plans.plans.pro.features.advancedReports"), included: true },
      { label: t("pages.plans.plans.pro.features.simulations"), included: true },
      { label: t("pages.plans.plans.pro.features.sharedEntries"), included: true },
      { label: t("pages.plans.plans.pro.features.support"), included: false },
    ],
  },
  {
    slug: "premium" as PlanSlug,
    name: t("pages.plans.plans.premium.name"),
    price_monthly: 79.9,
    features: [
      { label: t("pages.plans.plans.premium.features.transactions"), included: true },
      { label: t("pages.plans.plans.premium.features.goals"), included: true },
      { label: t("pages.plans.plans.premium.features.advancedReports"), included: true },
      { label: t("pages.plans.plans.premium.features.simulations"), included: true },
      { label: t("pages.plans.plans.premium.features.sharedEntries"), included: true },
      { label: t("pages.plans.plans.premium.features.support"), included: true },
    ],
  },
]);

const POPULAR_PLAN: PlanSlug = "pro";

// ── Checkout ──────────────────────────────────────────────────────────────────
const loadingSlug = ref<PlanSlug | null>(null);
const checkoutError = ref<string | null>(null);

/**
 * Initiates checkout for the given plan slug.
 * Redirects to the Stripe checkout URL returned by the backend.
 *
 * @param slug Plan slug to subscribe to.
 */
const handleSubscribe = async (slug: PlanSlug): Promise<void> => {
  if (slug === "free") { return; }
  loadingSlug.value = slug;
  checkoutError.value = null;

  try {
    const client = useSubscriptionClient();
    const url = await client.createCheckout(slug);
    window.location.href = url;
  } catch (err) {
    checkoutError.value = err instanceof Error ? err.message : t("pages.plans.checkoutError");
  } finally {
    loadingSlug.value = null;
  }
};
</script>

<template>
  <div class="plans-page">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="plans-page__header">
      <p class="plans-page__eyebrow">{{ $t('pages.plans.eyebrow') }}</p>
      <h1>{{ $t('pages.plans.title') }}</h1>
      <p class="plans-page__subtitle">{{ $t('pages.plans.subtitle') }}</p>
    </header>

    <!-- ── Error banner ───────────────────────────────────────────────── -->
    <p v-if="checkoutError" class="plans-page__error" role="alert">
      {{ checkoutError }}
    </p>

    <!-- ── Plans grid ─────────────────────────────────────────────────── -->
    <div class="plans-page__grid">
      <div
        v-for="plan in plans"
        :key="plan.slug"
        class="plan-col"
        :class="{ 'plan-col--popular': plan.slug === POPULAR_PLAN }"
      >
        <p v-if="plan.slug === POPULAR_PLAN" class="plan-col__badge">
          {{ $t('pages.plans.mostPopular') }}
        </p>

        <PlanCard
          :plan="plan"
          :is-current="false"
          @select="handleSubscribe($event as PlanSlug)"
        />

        <NButton
          v-if="plan.slug !== 'free'"
          type="primary"
          block
          :loading="loadingSlug === plan.slug"
          :disabled="loadingSlug !== null"
          :class="{ 'cta--highlight': plan.slug === POPULAR_PLAN }"
          @click="handleSubscribe(plan.slug)"
        >
          {{ $t('pages.plans.cta.subscribe') }}
        </NButton>

        <NButton
          v-else
          type="default"
          block
          disabled
        >
          {{ $t('pages.plans.cta.free') }}
        </NButton>
      </div>
    </div>

    <!-- ── Footer note ────────────────────────────────────────────────── -->
    <p class="plans-page__footnote">{{ $t('pages.plans.footnote') }}</p>
  </div>
</template>

<style scoped>
.plans-page {
  display: grid;
  gap: var(--space-4);
  padding-block: var(--space-6);
  max-width: 1100px;
  margin-inline: auto;
  padding-inline: var(--space-4);
}

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

.plans-page__header h1 {
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

.plans-page__error {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-negative) 10%, transparent);
  color: var(--color-negative);
  font-size: var(--font-size-sm);
  border: 1px solid color-mix(in srgb, var(--color-negative) 30%, transparent);
}

.plans-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  align-items: start;
}

.plan-col {
  display: grid;
  gap: var(--space-2);
  position: relative;
}

.plan-col--popular {
  padding-top: var(--space-5);
}

.plan-col__badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 2px var(--space-2);
  background: var(--color-brand-500);
  color: var(--color-bg-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.cta--highlight {
  background: var(--color-brand-600);
}

.plans-page__footnote {
  text-align: center;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

@media (max-width: 900px) {
  .plans-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .plans-page__grid {
    grid-template-columns: 1fr;
  }

  .plan-col--popular {
    padding-top: var(--space-5);
  }
}
</style>
