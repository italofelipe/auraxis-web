<script setup lang="ts">
import { NButton } from "naive-ui";
import type { UiInlineErrorProps, UiInlineErrorEmits } from "./UiInlineError.types";

withDefaults(defineProps<UiInlineErrorProps>(), {
  title: "Não foi possível carregar",
  message: undefined,
  retryLabel: undefined,
});

const emit = defineEmits<UiInlineErrorEmits>();

/** Propagates the retry event to the parent. */
function onRetry(): void {
  emit("retry");
}
</script>

<template>
  <div class="ui-inline-error" role="alert">
    <p class="ui-inline-error__title">{{ title }}</p>
    <p v-if="message" class="ui-inline-error__message">{{ message }}</p>
    <NButton
      v-if="retryLabel"
      class="ui-inline-error__retry"
      size="small"
      secondary
      @click="onRetry"
    >
      {{ retryLabel }}
    </NButton>
  </div>
</template>

<style scoped>
.ui-inline-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  border-left: 3px solid var(--color-negative);
}

.ui-inline-error__title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-negative);
}

.ui-inline-error__message {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ui-inline-error__retry {
  margin-top: var(--space-1);
}
</style>
