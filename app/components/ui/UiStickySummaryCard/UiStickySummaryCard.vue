<script setup lang="ts">
import UiGlassPanel from "../UiGlassPanel/UiGlassPanel.vue";

interface Props {
  /** Pass glow decoration to UiGlassPanel. Default: true */
  glow?: boolean
  /** Apply position:sticky behaviour. Default: true */
  sticky?: boolean
  /** CSS top value when sticky is active. Default: 'var(--space-3)' */
  topOffset?: string
}

const props = withDefaults(defineProps<Props>(), {
  glow: true,
  sticky: true,
  topOffset: "var(--space-3)",
});
</script>

<template>
  <div
    class="ui-sticky-summary-card"
    :class="{ 'ui-sticky-summary-card--sticky': props.sticky }"
    :style="props.sticky ? { top: props.topOffset } : undefined"
  >
    <UiGlassPanel :glow="props.glow">
      <slot />
    </UiGlassPanel>
  </div>
</template>

<style scoped>
.ui-sticky-summary-card--sticky {
  position: sticky;
}
</style>
