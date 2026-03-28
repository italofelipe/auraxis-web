<script setup lang="ts">
import type { UiGlassPanelProps } from "./UiGlassPanel.types";

const props = withDefaults(defineProps<UiGlassPanelProps>(), {
  glow: false,
  padding: "md",
  radius: "lg",
});
</script>

<template>
  <div
    class="ui-glass-panel"
    :class="[
      `ui-glass-panel--padding-${props.padding}`,
      `ui-glass-panel--radius-${props.radius}`,
      { 'ui-glass-panel--glow': props.glow },
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-glass-panel {
  position: relative;
  overflow: hidden;
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-outline-soft);
}
.ui-glass-panel--radius-sm  { border-radius: var(--radius-sm); }
.ui-glass-panel--radius-md  { border-radius: var(--radius-md); }
.ui-glass-panel--radius-lg  { border-radius: var(--radius-lg); }
.ui-glass-panel--padding-none { padding: 0; }
.ui-glass-panel--padding-sm  { padding: var(--space-2); }
.ui-glass-panel--padding-md  { padding: var(--space-3); }
.ui-glass-panel--padding-lg  { padding: var(--space-4); }
.ui-glass-panel--glow::before {
  content: '';
  position: absolute;
  top: -16px;
  right: -16px;
  width: 64px;
  height: 64px;
  background: var(--color-brand-600);
  border-radius: var(--radius-full);
  filter: blur(24px);
  opacity: 0.2;
  pointer-events: none;
}
</style>
