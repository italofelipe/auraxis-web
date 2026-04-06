<script setup lang="ts">
const { t } = useI18n();

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Em breve",
});

useSeoMeta({
  title: "Em breve | Auraxis",
  robots: "noindex",
});
</script>

<template>
  <div class="coming-soon-page">
    <div class="coming-soon-page__card">
      <div class="coming-soon-page__icon" aria-hidden="true">🚧</div>
      <h1 class="coming-soon-page__title">{{ t('pages.comingSoon.title') }}</h1>
      <p class="coming-soon-page__description">
        {{ t('pages.comingSoon.description') }}
      </p>
      <NuxtLink to="/dashboard" class="coming-soon-page__cta">
        {{ t('pages.comingSoon.backToDashboard') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.coming-soon-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.coming-soon-page__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  max-width: 480px;
  text-align: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-4);
}

.coming-soon-page__icon {
  font-size: var(--font-size-4xl);
  line-height: 1;
}

.coming-soon-page__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.coming-soon-page__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body);
}

.coming-soon-page__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: background 0.15s ease;
}

.coming-soon-page__cta:hover {
  background: var(--color-brand-700, var(--color-brand-600));
}
</style>
