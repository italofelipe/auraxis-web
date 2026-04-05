<script setup lang="ts">
import type { AuraxisIconName } from "~/shared/utils/icons/icons.types";

definePageMeta({ layout: "public" });

const { t } = useI18n();

useSeoMeta({
  title: t("pages.home.meta.title"),
  description: t("pages.home.meta.description"),
});

interface FeatureItem {
  key: string
  icon: AuraxisIconName
  title: string
  description: string
}

const features = computed((): FeatureItem[] => [
  {
    key: "dashboard",
    icon: "dashboard",
    title: t("pages.home.features.items.dashboard.title"),
    description: t("pages.home.features.items.dashboard.description"),
  },
  {
    key: "goals",
    icon: "goals",
    title: t("pages.home.features.items.goals.title"),
    description: t("pages.home.features.items.goals.description"),
  },
  {
    key: "portfolio",
    icon: "trendingUp",
    title: t("pages.home.features.items.portfolio.title"),
    description: t("pages.home.features.items.portfolio.description"),
  },
  {
    key: "tools",
    icon: "tools",
    title: t("pages.home.features.items.tools.title"),
    description: t("pages.home.features.items.tools.description"),
  },
]);
</script>

<template>
  <div class="home-page">
    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <section class="home-hero" aria-labelledby="hero-title">
      <div class="home-hero__content">
        <p class="home-hero__eyebrow">{{ t('pages.home.hero.eyebrow') }}</p>
        <h1 id="hero-title" class="home-hero__title">
          {{ t('pages.home.hero.title') }}
        </h1>
        <p class="home-hero__subtitle">
          {{ t('pages.home.hero.subtitle') }}
        </p>
        <div class="home-hero__actions">
          <NuxtLink to="/register" class="home-btn home-btn--primary home-btn--lg">
            {{ t('pages.home.hero.cta') }}
          </NuxtLink>
          <NuxtLink to="/plans" class="home-btn home-btn--ghost home-btn--lg">
            {{ t('pages.home.hero.ctaSecondary') }}
          </NuxtLink>
        </div>
      </div>
      <div class="home-hero__visual" aria-hidden="true">
        <div class="home-hero__card home-hero__card--1">
          <span class="home-hero__card-label">Saldo total</span>
          <span class="home-hero__card-value">R$ 42.380,00</span>
          <span class="home-hero__card-badge home-hero__card-badge--up">+12,4%</span>
        </div>
        <div class="home-hero__card home-hero__card--2">
          <span class="home-hero__card-label">Meta: Reserva</span>
          <div class="home-hero__progress-bar">
            <div class="home-hero__progress-fill" style="width: 68%" />
          </div>
          <span class="home-hero__card-sub">68% concluída</span>
        </div>
        <div class="home-hero__card home-hero__card--3">
          <span class="home-hero__card-label">Carteira</span>
          <span class="home-hero__card-value">R$ 18.500,00</span>
          <span class="home-hero__card-badge home-hero__card-badge--up">+5,2%</span>
        </div>
      </div>
    </section>

    <!-- ── Features ───────────────────────────────────────────────── -->
    <section class="home-features" aria-labelledby="features-title">
      <div class="home-features__header">
        <h2 id="features-title" class="home-features__title">
          {{ t('pages.home.features.title') }}
        </h2>
        <p class="home-features__subtitle">
          {{ t('pages.home.features.subtitle') }}
        </p>
      </div>
      <div class="home-features__grid">
        <article
          v-for="feature in features"
          :key="feature.key"
          class="home-feature-card"
        >
          <div class="home-feature-card__icon" aria-hidden="true">
            <UiIcon :name="feature.icon" :size="24" />
          </div>
          <h3 class="home-feature-card__title">{{ feature.title }}</h3>
          <p class="home-feature-card__description">{{ feature.description }}</p>
        </article>
      </div>
    </section>

    <!-- ── Plans callout ──────────────────────────────────────────── -->
    <section class="home-plans-callout" aria-labelledby="plans-title">
      <div class="home-plans-callout__inner">
        <p class="home-plans-callout__eyebrow">{{ t('pages.home.plans.eyebrow') }}</p>
        <h2 id="plans-title" class="home-plans-callout__title">
          {{ t('pages.home.plans.title') }}
        </h2>
        <p class="home-plans-callout__subtitle">
          {{ t('pages.home.plans.subtitle') }}
        </p>
        <NuxtLink to="/plans" class="home-btn home-btn--outline">
          {{ t('pages.home.plans.cta') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ── Final CTA ──────────────────────────────────────────────── -->
    <section class="home-cta" aria-labelledby="cta-title">
      <div class="home-cta__inner">
        <h2 id="cta-title" class="home-cta__title">
          {{ t('pages.home.cta.title') }}
        </h2>
        <p class="home-cta__subtitle">
          {{ t('pages.home.cta.subtitle') }}
        </p>
        <div class="home-cta__actions">
          <NuxtLink to="/register" class="home-btn home-btn--primary home-btn--lg">
            {{ t('pages.home.cta.button') }}
          </NuxtLink>
          <NuxtLink to="/login" class="home-btn home-btn--ghost home-btn--lg home-btn--light">
            {{ t('pages.home.cta.login') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Shared button primitives ────────────────────────────────────────────── */
.home-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease,
    border-color 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
}

.home-btn--lg {
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-sm);
}

.home-btn--primary {
  background: var(--color-brand-500);
  color: #fff;
}

.home-btn--primary:hover {
  background: var(--color-brand-600);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-brand-500) 40%, transparent);
}

.home-btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.home-btn--ghost:hover {
  background: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.home-btn--ghost.home-btn--light {
  color: rgb(255 255 255 / 80%);
}

.home-btn--ghost.home-btn--light:hover {
  color: #fff;
  background: rgb(255 255 255 / 12%);
}

.home-btn--outline {
  background: transparent;
  border-color: var(--color-brand-500);
  color: var(--color-brand-500);
  padding: var(--space-2) var(--space-5);
  font-size: var(--font-size-sm);
}

.home-btn--outline:hover {
  background: var(--color-brand-500);
  color: #fff;
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.home-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-10);
  align-items: center;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: clamp(var(--space-10), 8vw, 120px);
}

.home-hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-hero__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-xs);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.home-hero__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(var(--font-size-heading-xl), 4vw, 52px);
  line-height: 1.15;
  color: var(--color-text-primary);
}

.home-hero__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-md);
  max-width: 480px;
}

.home-hero__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

/* ── Hero visual cards ───────────────────────────────────────────────────── */
.home-hero__visual {
  position: relative;
  height: 320px;
}

.home-hero__card {
  position: absolute;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 180px;
}

.home-hero__card--1 {
  top: 0;
  left: 0;
  z-index: 3;
}

.home-hero__card--2 {
  top: 50%;
  left: 50%;
  transform: translate(-30%, -50%);
  z-index: 2;
  min-width: 220px;
}

.home-hero__card--3 {
  bottom: 0;
  right: 0;
  z-index: 1;
}

.home-hero__card-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.home-hero__card-value {
  font-size: var(--font-size-heading-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-family: var(--font-heading);
}

.home-hero__card-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.home-hero__card-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  align-self: flex-start;
}

.home-hero__card-badge--up {
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.home-hero__progress-bar {
  height: 6px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.home-hero__progress-fill {
  height: 100%;
  background: var(--color-brand-500);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

/* ── Features ────────────────────────────────────────────────────────────── */
.home-features {
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-outline-soft);
  border-bottom: 1px solid var(--color-outline-soft);
}

.home-features__header {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-top: clamp(var(--space-8), 6vw, 80px);
  padding-bottom: var(--space-6);
  text-align: center;
}

.home-features__title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  color: var(--color-text-primary);
}

.home-features__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.home-features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-bottom: clamp(var(--space-8), 6vw, 80px);
}

.home-feature-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-bg-base);
  border: 1px solid var(--color-outline-soft);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.home-feature-card:hover {
  border-color: var(--color-brand-400);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-brand-500) 8%, transparent);
}

.home-feature-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
  color: var(--color-brand-500);
}

.home-feature-card__title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.home-feature-card__description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-sm);
}

/* ── Plans callout ───────────────────────────────────────────────────────── */
.home-plans-callout {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: clamp(var(--space-8), 6vw, 80px);
}

.home-plans-callout__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
}

.home-plans-callout__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-xs);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.home-plans-callout__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  color: var(--color-text-primary);
}

.home-plans-callout__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ── Final CTA ───────────────────────────────────────────────────────────── */
.home-cta {
  background: var(--color-brand-600);
}

.home-cta__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  max-width: 720px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: clamp(var(--space-10), 8vw, 100px);
}

.home-cta__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  color: #fff;
}

.home-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  color: rgb(255 255 255 / 80%);
  line-height: var(--line-height-body-md);
}

.home-cta__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .home-hero {
    grid-template-columns: 1fr;
    padding-block: var(--space-8);
  }

  .home-hero__visual {
    display: none;
  }

  .home-hero__actions {
    flex-direction: column;
  }

  .home-hero__actions .home-btn {
    width: 100%;
    justify-content: center;
  }

  .home-cta__actions {
    flex-direction: column;
    width: 100%;
  }

  .home-cta__actions .home-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
