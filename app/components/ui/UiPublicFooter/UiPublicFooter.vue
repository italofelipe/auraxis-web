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
    <div class="ui-public-footer__inner">
      <p class="ui-public-footer__copyright">
        &copy; {{ copyrightYear }} {{ t("components.publicFooter.brand") }} &middot; Precision
        Layered Analytics
      </p>
      <nav
        class="ui-public-footer__links"
        :aria-label="t('components.publicFooter.columns.legal.title')"
      >
        <NuxtLink to="/privacy" class="ui-public-footer__link">
          {{ t("components.publicFooter.columns.legal.links.privacy") }}
        </NuxtLink>
        <NuxtLink to="/terms" class="ui-public-footer__link">
          {{ t("components.publicFooter.columns.legal.links.terms") }}
        </NuxtLink>
        <NuxtLink to="/cookies" class="ui-public-footer__link"> Cookies </NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.ui-public-footer {
  background: var(--color-bg-base);
  border-top: 1px solid var(--color-outline-soft);
}

.ui-public-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: var(--space-5);
}

.ui-public-footer__copyright {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-public-footer__links {
  display: flex;
  align-items: center;
  gap: var(--space-4);
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

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ui-public-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
