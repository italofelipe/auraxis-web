<script setup lang="ts">
import { computed } from "vue";

/**
 * Canonical loading skeleton for the Auraxis web app (UX-3).
 *
 * Wraps a small shimmer block with a few well-bounded variants so every
 * feature uses the same visual rhythm. Prefer this over direct `NSkeleton`
 * imports — it lets us tune the animation, color, and radius in one place.
 */
type SkeletonVariant = "text" | "line" | "block" | "button" | "circle" | "card" | "chart";

interface Props {
  /** Visual shape. Defaults to "line" (a horizontal bar). */
  variant?: SkeletonVariant;
  /** CSS height (e.g. `"20px"`, `"4rem"`). Ignored for `circle`. */
  height?: string;
  /** CSS width (e.g. `"60%"`, `"120px"`). Ignored for `circle`. */
  width?: string;
  /** Diameter for `circle` variant. */
  size?: string;
  /** Repeat the skeleton N times (useful for list placeholders). */
  repeat?: number;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "line",
  height: undefined,
  width: undefined,
  size: "40px",
  repeat: 1,
});

const computedHeight = computed<string>((): string => {
  if (props.variant === "circle") { return props.size; }
  if (props.height) { return props.height; }
  if (props.variant === "text") { return "14px"; }
  if (props.variant === "button") { return "36px"; }
  if (props.variant === "block") { return "80px"; }
  if (props.variant === "card") { return "100px"; }
  if (props.variant === "chart") { return "180px"; }
  return "20px";
});

const computedWidth = computed<string>((): string => {
  if (props.variant === "circle") { return props.size; }
  return props.width ?? "100%";
});

const radiusToken = computed<string>((): string => {
  if (props.variant === "circle") { return "9999px"; }
  if (props.variant === "button") { return "var(--radius-md, 8px)"; }
  if (props.variant === "card") { return "var(--radius-md, 8px)"; }
  if (props.variant === "chart") { return "var(--radius-md, 8px)"; }
  return "var(--radius-sm, 4px)";
});

const count = computed<number>((): number => Math.max(1, props.repeat));
</script>

<template>
  <template v-if="count === 1">
    <div
      class="base-skeleton"
      :class="`base-skeleton--${variant}`"
      :style="{ height: computedHeight, width: computedWidth, borderRadius: radiusToken }"
      aria-hidden="true"
      data-testid="base-skeleton"
    />
  </template>
  <template v-else>
    <div
      v-for="n in count"
      :key="n"
      class="base-skeleton"
      :class="`base-skeleton--${variant}`"
      :style="{ height: computedHeight, width: computedWidth, borderRadius: radiusToken }"
      aria-hidden="true"
      data-testid="base-skeleton"
    />
  </template>
</template>

<style scoped>
.base-skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    rgba(65, 57, 57, 0.12) 0%,
    rgba(65, 57, 57, 0.22) 50%,
    rgba(65, 57, 57, 0.12) 100%
  );
  background-size: 200% 100%;
  animation: base-skeleton-shimmer 1.6s infinite;
}

.base-skeleton + .base-skeleton {
  margin-top: 8px;
}

.base-skeleton--circle {
  display: inline-block;
}

@media (prefers-reduced-motion: reduce) {
  .base-skeleton {
    animation: none;
  }
}

@keyframes base-skeleton-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
