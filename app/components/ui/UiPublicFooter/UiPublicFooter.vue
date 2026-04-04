<script setup lang="ts">
import type { UiPublicFooterProps } from "./UiPublicFooter.types";

const props = withDefaults(defineProps<UiPublicFooterProps>(), {
  year: undefined,
});

const { t } = useI18n();

const copyrightYear = computed<number>(() =>
  props.year !== undefined ? props.year : new Date().getFullYear(),
);
</script>

<template>
  <footer class="ui-public-footer">
    <div class="ui-public-footer__container">
      <!-- Brand column -->
      <div class="ui-public-footer__brand-col">
        <NuxtLink to="/" class="ui-public-footer__brand">
          {{ t('components.publicFooter.brand') }}
        </NuxtLink>
        <p class="ui-public-footer__tagline">
          {{ t('components.publicFooter.tagline') }}
        </p>
      </div>

      <!-- Product links -->
      <nav
        class="ui-public-footer__nav-col"
        :aria-label="t('components.publicFooter.columns.product.title')"
      >
        <h3 class="ui-public-footer__col-title">
          {{ t('components.publicFooter.columns.product.title') }}
        </h3>
        <ul class="ui-public-footer__link-list">
          <li>
            <NuxtLink to="/tools" class="ui-public-footer__link">
              {{ t('components.publicFooter.columns.product.links.tools') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/plans" class="ui-public-footer__link">
              {{ t('components.publicFooter.columns.product.links.plans') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/login" class="ui-public-footer__link">
              {{ t('components.publicFooter.columns.product.links.login') }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Legal links -->
      <nav
        class="ui-public-footer__nav-col"
        :aria-label="t('components.publicFooter.columns.legal.title')"
      >
        <h3 class="ui-public-footer__col-title">
          {{ t('components.publicFooter.columns.legal.title') }}
        </h3>
        <ul class="ui-public-footer__link-list">
          <li>
            <NuxtLink to="/terms-of-service" class="ui-public-footer__link">
              {{ t('components.publicFooter.columns.legal.links.terms') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/privacy-policy" class="ui-public-footer__link">
              {{ t('components.publicFooter.columns.legal.links.privacy') }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Bottom bar -->
    <div class="ui-public-footer__bottom">
      <div class="ui-public-footer__bottom-inner">
        <p class="ui-public-footer__copyright">
          {{ t('components.publicFooter.copyright', { year: copyrightYear }) }}
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.ui-public-footer {
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-outline-soft);
}

.ui-public-footer__container {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-6);
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: var(--space-8);
}

/* ── Brand column ───────────────────────────────────────────────────────────── */
.ui-public-footer__brand-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ui-public-footer__brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-decoration: none;
}

.ui-public-footer__brand:hover {
  color: var(--color-brand-500);
}

.ui-public-footer__tagline {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 240px;
  line-height: var(--line-height-body-sm);
}

/* ── Nav columns ────────────────────────────────────────────────────────────── */
.ui-public-footer__nav-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ui-public-footer__col-title {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.ui-public-footer__link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ui-public-footer__link {
  text-decoration: none;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: color 0.15s ease;
}

.ui-public-footer__link:hover {
  color: var(--color-text-primary);
}

/* ── Bottom bar ─────────────────────────────────────────────────────────────── */
.ui-public-footer__bottom {
  border-top: 1px solid var(--color-outline-soft);
}

.ui-public-footer__bottom-inner {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: var(--space-3);
}

.ui-public-footer__copyright {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ui-public-footer__container {
    grid-template-columns: 1fr;
    gap: var(--space-5);
    padding-block: var(--space-6);
  }
}
</style>
