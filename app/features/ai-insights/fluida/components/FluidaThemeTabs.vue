<script setup lang="ts">
import type { FluidaThemeId, FluidaThemeMeta } from "../model/insight-fluida";

defineProps<{
  tabs: readonly FluidaThemeMeta[];
  active: FluidaThemeId;
}>();

const emit = defineEmits<{
  (event: "update:active", value: FluidaThemeId): void;
}>();
</script>

<template>
  <div class="fluida-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="fluida-tabs__tab"
      :class="{ 'fluida-tabs__tab--on': tab.id === active }"
      :style="{ '--fluida-tab-accent': tab.colorVar }"
      :aria-selected="tab.id === active"
      @click="emit('update:active', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.fluida-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 2px 0;
}

.fluida-tabs__tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--fluida-line);
  border-radius: var(--fluida-radius-pill);
  background: var(--fluida-surface);
  color: var(--fluida-body);
  font-family: inherit;
  font-size: var(--fluida-size-body-sm);
  font-weight: var(--fluida-weight-strong);
  cursor: pointer;
  box-shadow: var(--fluida-shadow);
  transition: background var(--motion-fast), color var(--motion-fast),
    transform var(--motion-fast);
}

.fluida-tabs__tab:hover {
  transform: translateY(-1px);
}

.fluida-tabs__tab--on {
  background: var(--fluida-tab-accent);
  border-color: transparent;
  color: var(--fluida-on-accent);
  box-shadow: none;
}
</style>
