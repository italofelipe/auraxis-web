<script setup lang="ts">
import { PieChart } from "lucide-vue-next";
import type { NuxtError } from "nuxt/app";

const props = defineProps<{
  error: NuxtError;
}>();

const { t } = useI18n();

const is404 = computed(() => props.error.statusCode === 404);

/**
 * Clears the error and navigates the user back to the home page.
 */
const handleGoHome = async (): Promise<void> => {
  await clearError({ redirect: "/" });
};

/**
 * Clears the error and reloads the current page.
 */
const handleRetry = async (): Promise<void> => {
  await clearError({ redirect: useRoute().fullPath });
};
</script>

<template>
  <div class="error-page">
    <!-- Auraxis branding header -->
    <div class="error-page__brand">
      <div class="error-page__logo-mark" aria-hidden="true">
        <PieChart :size="16" />
      </div>
      <span class="error-page__logo-text">Auraxis</span>
    </div>

    <div class="error-content">
      <p class="error-code" aria-label="`${error.statusCode}`">
        {{ error.statusCode }}
      </p>

      <template v-if="is404">
        <h1 class="error-title">{{ t('error.404.title') }}</h1>
        <p class="error-message">{{ t('error.404.description') }}</p>
        <NuxtLink class="error-cta error-cta--primary" to="/" @click.prevent="handleGoHome">
          {{ t('error.404.cta') }}
        </NuxtLink>
      </template>

      <template v-else>
        <h1 class="error-title">{{ t('error.500.title') }}</h1>
        <p class="error-message">{{ t('error.500.description') }}</p>
        <div class="error-actions">
          <button class="error-cta error-cta--primary" type="button" @click="handleRetry">
            {{ t('error.500.retry') }}
          </button>
          <NuxtLink class="error-cta error-cta--secondary" to="/" @click.prevent="handleGoHome">
            {{ t('error.500.home') }}
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--color-bg-base, #0b0909);
  font-family: var(--font-body, system-ui, sans-serif);
}

/* Branding */
.error-page__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
}

.error-page__logo-mark {
  width: 32px;
  height: 32px;
  background: var(--color-brand-600, #ffab1a);
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bg-base, #0b0909);
  box-shadow: 0 0 12px rgba(255, 171, 26, 0.25);
}

.error-page__logo-text {
  font-family: var(--font-heading, serif);
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary, #fff);
}

/* Content */
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  gap: 1rem;
}

.error-code {
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: 1;
  margin: 0;
  color: var(--color-brand-600, #ffab1a);
  letter-spacing: -2px;
}

.error-title {
  font-family: var(--font-heading, serif);
  font-size: var(--font-size-heading-lg, 1.75rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary, #fff);
  margin: 0;
}

.error-message {
  font-size: var(--font-size-base, 1rem);
  color: var(--color-text-secondary, #b0a9a9);
  margin: 0;
  line-height: 1.6;
}

/* Actions */
.error-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  font-family: var(--font-body, system-ui, sans-serif);
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.error-cta--primary {
  background: var(--color-brand-600, #ffab1a);
  color: var(--color-bg-base, #0b0909);
}

.error-cta--primary:hover {
  background: var(--color-brand-500, #ffc44d);
}

.error-cta--secondary {
  background: var(--color-bg-elevated, #3a2e2e);
  color: var(--color-text-secondary, #b0a9a9);
  border: 1px solid var(--color-outline-soft, rgba(255, 255, 255, 0.1));
}

.error-cta--secondary:hover {
  background: var(--color-outline-ghost, rgba(255, 255, 255, 0.05));
  color: var(--color-text-primary, #fff);
}
</style>
