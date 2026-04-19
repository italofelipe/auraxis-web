<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";
import { NAlert, NButton } from "naive-ui";
import { captureException } from "~/core/observability";

const hasError = ref(false);
const errorMessage = ref<string | null>(null);

onErrorCaptured((err) => {
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);
  captureException(err, { context: "FeatureErrorBoundary" });
  return false;
});

/** Clears the captured error so the default slot renders again. */
function retry(): void {
  hasError.value = false;
  errorMessage.value = null;
}
</script>

<template>
  <slot v-if="!hasError" />
  <slot
    v-else
    name="fallback"
    :retry="retry"
    :error-message="errorMessage"
  >
    <div class="feature-error-boundary">
      <NAlert type="error" :title="$t('errors.featureBoundary.title')" class="feature-error-boundary__alert">
        <p>{{ $t('errors.featureBoundary.description') }}</p>
        <NButton size="small" style="margin-top: 8px" @click="retry">
          {{ $t('errors.featureBoundary.retry') }}
        </NButton>
      </NAlert>
    </div>
  </slot>
</template>

<style scoped>
.feature-error-boundary {
  padding: var(--space-4, 16px);
}

.feature-error-boundary__alert {
  max-width: 480px;
}
</style>
