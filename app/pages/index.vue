<script setup lang="ts">
definePageMeta({ layout: "public" });

const { t } = useI18n();

useSeoMeta({
  title: t("pages.home.meta.title"),
  description: t("pages.home.meta.description"),
});

const productItems = computed(() => [
  { key: "essential", ...tItem("pages.home.product.items.essential") },
  { key: "analytic", ...tItem("pages.home.product.items.analytic") },
  { key: "narrative", ...tItem("pages.home.product.items.narrative") },
]);

const analyticsItems = computed(() => [
  { key: "cashflow", kpiClass: "landing-kpi--profit", ...tItemKpi("pages.home.analytics.items.cashflow") },
  { key: "composition", kpiClass: "landing-kpi--loss", ...tItemKpi("pages.home.analytics.items.composition") },
  { key: "trend", kpiClass: "landing-kpi--info", ...tItemKpi("pages.home.analytics.items.trend") },
]);

const planItems = computed(() => [
  { key: "essential", ...tItemPrice("pages.home.plans.items.essential") },
  { key: "pro", ...tItemPrice("pages.home.plans.items.pro") },
  { key: "enterprise", ...tItemPrice("pages.home.plans.items.enterprise") },
]);

/**
 * Resolve title + description i18n keys for a given prefix.
 * @param prefix - i18n key prefix
 * @returns translated title and description
 */
function tItem(prefix: string): { title: string; description: string } {
  return { title: t(`${prefix}.title`), description: t(`${prefix}.description`) };
}

/**
 * Resolve title + kpi + description i18n keys for a given prefix.
 * @param prefix - i18n key prefix
 * @returns translated title, kpi and description
 */
function tItemKpi(prefix: string): { title: string; kpi: string; description: string } {
  return { title: t(`${prefix}.title`), kpi: t(`${prefix}.kpi`), description: t(`${prefix}.description`) };
}

/**
 * Resolve title + price + description i18n keys for a given prefix.
 * @param prefix - i18n key prefix
 * @returns translated title, price and description
 */
function tItemPrice(prefix: string): { title: string; price: string; description: string } {
  return { title: t(`${prefix}.title`), price: t(`${prefix}.price`), description: t(`${prefix}.description`) };
}
</script>

<template>
  <div class="landing">
    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <section class="landing-hero" aria-labelledby="hero-title">
      <div class="landing-container landing-hero__grid">
        <div class="landing-hero__content">
          <span class="landing-badge">{{ t('pages.home.hero.eyebrow') }}</span>
          <h1 id="hero-title" class="landing-hero__title">
            {{ t('pages.home.hero.title') }}
          </h1>
          <p class="landing-hero__subtitle">
            {{ t('pages.home.hero.subtitle') }}
          </p>
          <div class="landing-hero__actions">
            <NuxtLink to="/register" class="landing-btn landing-btn--primary">
              {{ t('pages.home.hero.cta') }}
            </NuxtLink>
            <NuxtLink to="/login" class="landing-btn landing-btn--secondary">
              {{ t('pages.home.hero.ctaSecondary') }}
            </NuxtLink>
          </div>
        </div>

        <article class="landing-hero__card glass" aria-label="Analytics preview">
          <p class="landing-hero__card-helper">{{ t('pages.home.hero.previewLabel') }}</p>
          <p class="landing-kpi landing-kpi--info">{{ t('pages.home.hero.previewValue') }}</p>
          <p class="landing-hero__card-desc">{{ t('pages.home.hero.previewDesc') }}</p>
          <svg class="landing-sparkline" viewBox="0 0 600 180" role="img" aria-hidden="true">
            <polyline fill="none" stroke="var(--color-brand-500)" stroke-width="4" points="10,128 90,112 170,96 250,88 330,71 410,66 490,58 590,38" />
            <polyline fill="none" stroke="var(--color-negative, #ff6f79)" stroke-width="4" points="10,145 90,133 170,125 250,114 330,106 410,111 490,103 590,99" opacity="0.9" />
          </svg>
        </article>
      </div>
    </section>

    <!-- ── Product ───────────────────────────────────────────────────── -->
    <section class="landing-section" aria-labelledby="product-title">
      <div class="landing-container">
        <div class="landing-section__head">
          <h2 id="product-title" class="landing-section__title">{{ t('pages.home.product.title') }}</h2>
          <p class="landing-section__subtitle">{{ t('pages.home.product.subtitle') }}</p>
        </div>
        <div class="landing-cards-grid">
          <article v-for="item in productItems" :key="item.key" class="landing-feature-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Analytics ─────────────────────────────────────────────────── -->
    <section class="landing-section" aria-labelledby="analytics-title">
      <div class="landing-container">
        <div class="landing-section__head">
          <h2 id="analytics-title" class="landing-section__title">{{ t('pages.home.analytics.title') }}</h2>
          <p class="landing-section__subtitle">{{ t('pages.home.analytics.subtitle') }}</p>
        </div>
        <div class="landing-cards-grid">
          <article v-for="item in analyticsItems" :key="item.key" class="landing-metric-card">
            <h3>{{ item.title }}</h3>
            <p :class="['landing-kpi', item.kpiClass]">{{ item.kpi }}</p>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Plans ─────────────────────────────────────────────────────── -->
    <section class="landing-section" aria-labelledby="plans-title">
      <div class="landing-container">
        <div class="landing-section__head">
          <h2 id="plans-title" class="landing-section__title">{{ t('pages.home.plans.title') }}</h2>
          <p class="landing-section__subtitle">{{ t('pages.home.plans.subtitle') }}</p>
        </div>
        <div class="landing-cards-grid">
          <article v-for="item in planItems" :key="item.key" class="landing-plan-card">
            <h3>{{ item.title }}</h3>
            <p class="landing-kpi landing-kpi--info">{{ item.price }}</p>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ──────────────────────────────────────────────────── -->
    <section class="landing-cta" aria-labelledby="cta-title">
      <div class="landing-container landing-cta__inner">
        <h2 id="cta-title" class="landing-cta__title">
          {{ t('pages.home.cta.title') }}
        </h2>
        <p class="landing-cta__subtitle">
          {{ t('pages.home.cta.subtitle') }}
        </p>
        <div class="landing-cta__actions">
          <NuxtLink to="/register" class="landing-btn landing-btn--primary">
            {{ t('pages.home.cta.button') }}
          </NuxtLink>
          <NuxtLink to="/login" class="landing-btn landing-btn--ghost">
            {{ t('pages.home.cta.login') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────────────── */
.landing-container {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
}

/* ── Badge ─────────────────────────────────────────────────────────────────── */
.landing-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid rgba(68, 212, 255, 0.4);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brand-500);
  background: rgba(68, 212, 255, 0.1);
  font-weight: var(--font-weight-semibold);
}

/* ── Buttons ───────────────────────────────────────────────────────────────── */
.landing-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: transform 220ms ease, filter 220ms ease;
}

.landing-btn--primary {
  background: linear-gradient(140deg, #44d4ff, #42e8a9);
  color: #051220;
  box-shadow: 0 var(--space-4) 44px rgba(68, 212, 255, 0.24);
}

.landing-btn--primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.landing-btn--secondary {
  background: transparent;
  border: 1px solid var(--color-outline-soft);
  color: var(--color-text-secondary);
}

.landing-btn--secondary:hover {
  border-color: var(--color-brand-500);
  color: var(--color-text-primary);
}

.landing-btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.landing-btn--ghost:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

/* ── Glass ─────────────────────────────────────────────────────────────────── */
.glass {
  background: linear-gradient(175deg, rgba(18, 26, 42, 0.86), rgba(10, 15, 26, 0.92));
  border: 1px solid var(--color-outline-soft);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
.landing-hero {
  padding-block: clamp(var(--space-8), 8vw, 120px);
}

.landing-hero__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}

.landing-hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.landing-hero__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(var(--font-size-heading-lg), 4vw, var(--font-size-4xl));
  line-height: var(--line-height-heading-xl);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.landing-hero__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-md);
  max-width: 480px;
}

.landing-hero__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.landing-hero__card {
  border-radius: var(--radius-xl, 28px);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.landing-hero__card-helper {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-weight-medium);
}

.landing-hero__card-desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-sm);
}

.landing-sparkline {
  width: 100%;
  height: auto;
  margin-top: var(--space-2);
}

/* ── KPI ───────────────────────────────────────────────────────────────────── */
.landing-kpi {
  margin: 0;
  font-size: var(--font-size-heading-md);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
}

.landing-kpi--info {
  color: var(--color-brand-500);
}

.landing-kpi--profit {
  color: var(--color-positive);
}

.landing-kpi--loss {
  color: var(--color-negative);
}

/* ── Sections ──────────────────────────────────────────────────────────────── */
.landing-section {
  padding-block: clamp(var(--space-8), 6vw, 80px);
  border-top: 1px solid var(--color-outline-soft);
}

.landing-section__head {
  text-align: center;
  margin-bottom: var(--space-6);
}

.landing-section__title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.landing-section__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ── Card grids ────────────────────────────────────────────────────────────── */
.landing-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.landing-feature-card,
.landing-metric-card,
.landing-plan-card {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.landing-feature-card:hover,
.landing-metric-card:hover,
.landing-plan-card:hover {
  border-color: rgba(68, 212, 255, 0.3);
  box-shadow: 0 4px 20px rgba(68, 212, 255, 0.08);
}

.landing-feature-card h3,
.landing-metric-card h3,
.landing-plan-card h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.landing-feature-card p,
.landing-metric-card p,
.landing-plan-card p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-sm);
}

.landing-metric-card .landing-kpi,
.landing-plan-card .landing-kpi {
  margin-bottom: var(--space-2);
}

/* ── CTA ───────────────────────────────────────────────────────────────────── */
.landing-cta {
  background: linear-gradient(140deg, rgba(68, 212, 255, 0.12), rgba(139, 125, 255, 0.08));
  border-top: 1px solid var(--color-outline-soft);
}

.landing-cta__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  padding-block: clamp(var(--space-8), 8vw, 100px);
  max-width: 720px;
}

.landing-cta__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.landing-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-md);
}

.landing-cta__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .landing-hero__grid {
    grid-template-columns: 1fr;
  }

  .landing-hero__card {
    display: none;
  }

  .landing-cards-grid {
    grid-template-columns: 1fr;
  }

  .landing-hero__actions,
  .landing-cta__actions {
    flex-direction: column;
    width: 100%;
  }

  .landing-hero__actions .landing-btn,
  .landing-cta__actions .landing-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (min-width: 861px) and (max-width: 1060px) {
  .landing-cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
