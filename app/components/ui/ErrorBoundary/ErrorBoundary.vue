<script setup lang="ts">
import { ref, onErrorCaptured, type Component, type ComponentPublicInstance } from "vue";
import * as Sentry from "@sentry/nuxt";

interface ErrorBoundaryProps {
  feature: string;
  fallback?: Component;
  onError?: (err: unknown, instance: ComponentPublicInstance | null, info: string) => void;
}

const props = defineProps<ErrorBoundaryProps>();
const hasError = ref<boolean>(false);

onErrorCaptured((err: unknown, instance: ComponentPublicInstance | null, info: string) => {
  hasError.value = true;
  try {
    Sentry.withScope((scope) => {
      scope.setTag("feature", props.feature);
      Sentry.captureException(err);
    });
  } catch {
    // Sentry unavailable — degrade silently
  }
  props.onError?.(err, instance, info);
  return false;
});

/**
 * Resets the error state, allowing the slot to render again.
 */
function retry(): void {
  hasError.value = false;
}
</script>

<template>
  <slot v-if="!hasError" />
  <component :is="fallback" v-else-if="fallback" :on-retry="retry" />
  <div v-else class="error-boundary" role="alert">
    <div class="error-boundary__body">
      <p class="error-boundary__message">{{ $t('errors.featureBoundary.description') }}</p>
      <button type="button" class="error-boundary__retry" @click="retry">
        {{ $t('errors.featureBoundary.retry') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4, 1.5rem);
  border-radius: var(--radius-sm, 10px);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
}
.error-boundary__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  text-align: center;
  max-width: 360px;
}
.error-boundary__message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.error-boundary__retry {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-brand-500);
  color: var(--color-bg-base, #05070d);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: filter var(--transition-fast, 0.15s ease);
}
.error-boundary__retry:hover {
  filter: brightness(1.1);
}
</style>
