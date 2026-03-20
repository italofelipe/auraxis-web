<script setup lang="ts">
import { computed } from "vue";
import { TrendingUp, TrendingDown, Minus } from "lucide-vue-next";
import type { UiTrendBadgeProps, TrendDirection } from "./UiTrendBadge.types";

const props = withDefaults(defineProps<UiTrendBadgeProps>(), {
  showIcon: true,
  decimals: 2,
});

const direction = computed<TrendDirection>(() => {
  if (props.value > 0) {return "positive";}
  if (props.value < 0) {return "negative";}
  return "neutral";
});

const icon = computed(() => {
  if (direction.value === "positive") {return TrendingUp;}
  if (direction.value === "negative") {return TrendingDown;}
  return Minus;
});

const formatted = computed(() => {
  const sign = props.value > 0 ? "+" : "";
  return `${sign}${props.value.toFixed(props.decimals).replace(".", ",")}%`;
});
</script>

<template>
  <span
    class="ui-trend-badge"
    :class="`ui-trend-badge--${direction}`"
    :aria-label="`variação: ${formatted}`"
  >
    <component :is="icon" v-if="showIcon" :size="12" class="ui-trend-badge__icon" aria-hidden="true" />
    <span>{{ formatted }}</span>
  </span>
</template>

<style scoped>
.ui-trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}
.ui-trend-badge--positive {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}
.ui-trend-badge--negative {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}
.ui-trend-badge--neutral {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
}
.ui-trend-badge__icon {
  flex-shrink: 0;
}
</style>
