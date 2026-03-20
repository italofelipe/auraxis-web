<script setup lang="ts">
import type { UiEmptyStateProps, UiEmptyStateEmits } from "./UiEmptyState.types";

withDefaults(defineProps<UiEmptyStateProps>(), {
  icon: undefined,
  description: undefined,
  actionLabel: undefined,
});

const emit = defineEmits<UiEmptyStateEmits>();
</script>

<template>
  <div class="ui-empty-state" role="status">
    <div v-if="icon" class="ui-empty-state__icon-wrap" aria-hidden="true">
      <component :is="icon" :size="40" />
    </div>
    <h3 class="ui-empty-state__title">{{ title }}</h3>
    <p v-if="description" class="ui-empty-state__description">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="ui-empty-state__action"
      type="button"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  text-align: center;
}
.ui-empty-state__icon-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
}
.ui-empty-state__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}
.ui-empty-state__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 320px;
  margin: 0;
}
.ui-empty-state__action {
  margin-top: var(--space-1);
  padding: 10px var(--space-3);
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease;
}
.ui-empty-state__action:hover {
  background: var(--color-brand-500);
}
</style>
