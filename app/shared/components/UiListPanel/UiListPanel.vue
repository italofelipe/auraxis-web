<script setup lang="ts">
import UiSurfaceCard from "../UiSurfaceCard/UiSurfaceCard.vue";
import type { UiListPanelProps } from "./UiListPanel.types";

const props = withDefaults(defineProps<UiListPanelProps>(), {
  title: undefined,
  loading: false,
  loadingRows: 4,
});

const slots = useSlots();
</script>

<template>
  <UiSurfaceCard class="ui-list-panel" padding="none">
    <div
      v-if="props.title || slots['header-action']"
      class="ui-list-panel__header"
    >
      <h3 v-if="props.title" class="ui-list-panel__title">
        {{ props.title }}
      </h3>
      <div class="ui-list-panel__header-action">
        <slot name="header-action" />
      </div>
    </div>

    <div v-if="slots['filters']" class="ui-list-panel__filters">
      <slot name="filters" />
    </div>

    <div class="ui-list-panel__body">
      <template v-if="props.loading">
        <div
          v-for="i in props.loadingRows"
          :key="i"
          class="ui-list-panel__skeleton-row"
          aria-hidden="true"
        />
      </template>
      <slot v-else />
    </div>
  </UiSurfaceCard>
</template>

<style scoped>
.ui-list-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ui-list-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
}

.ui-list-panel__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.ui-list-panel__header-action {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.ui-list-panel__filters {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
}

.ui-list-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ui-list-panel__skeleton-row {
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  animation: lp-pulse 1.5s ease-in-out infinite;
}

.ui-list-panel__skeleton-row:nth-child(2) { animation-delay: 0.15s; }
.ui-list-panel__skeleton-row:nth-child(3) { animation-delay: 0.3s; }
.ui-list-panel__skeleton-row:nth-child(4) { animation-delay: 0.45s; }

@keyframes lp-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
</style>
