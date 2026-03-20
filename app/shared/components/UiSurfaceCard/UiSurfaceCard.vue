<script setup lang="ts">
import type { UiSurfaceCardProps } from "./UiSurfaceCard.types";

const props = withDefaults(defineProps<UiSurfaceCardProps>(), {
  padding: "md",
  shadow: true,
  bordered: true,
  as: "div",
});
</script>

<template>
  <component
    :is="props.as"
    class="ui-surface-card"
    :class="[
      `ui-surface-card--padding-${props.padding}`,
      { 'ui-surface-card--shadow': props.shadow },
      { 'ui-surface-card--bordered': props.bordered },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.ui-surface-card {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
}
.ui-surface-card--bordered {
  border: 1px solid var(--color-outline-soft);
}
.ui-surface-card--shadow {
  box-shadow: var(--shadow-card);
}
.ui-surface-card--padding-none { padding: 0; }
.ui-surface-card--padding-sm  { padding: var(--space-2); }
.ui-surface-card--padding-md  { padding: var(--space-3); }
.ui-surface-card--padding-lg  { padding: var(--space-4); }
</style>
