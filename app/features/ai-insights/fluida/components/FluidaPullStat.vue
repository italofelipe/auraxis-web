<script setup lang="ts">
import type { FluidaStat } from "../model/insight-fluida";

withDefaults(
  defineProps<{
    stat: FluidaStat;
    accentColor?: string;
  }>(),
  {
    accentColor: "var(--fluida-brand)",
  },
);
</script>

<template>
  <div class="fluida-pull-stat" :style="{ '--fluida-pull-accent': accentColor }">
    <span class="fluida-pull-stat__label">{{ stat.label }}</span>
    <span class="fluida-pull-stat__value">{{ stat.value }}</span>
    <span class="fluida-pull-stat__caption">{{ stat.caption }}</span>
  </div>
</template>

<style scoped>
.fluida-pull-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--space-4);
  border-left: 3px solid var(--fluida-pull-accent);
}

.fluida-pull-stat__label {
  font-size: var(--fluida-size-label);
  font-weight: var(--fluida-weight-strong);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fluida-muted);
}

.fluida-pull-stat__value {
  font-family: var(--fluida-font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--fluida-size-pullstat);
  font-weight: var(--fluida-weight-strong);
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: var(--fluida-ink);
}

.fluida-pull-stat__caption {
  font-size: var(--fluida-size-body-sm);
  font-weight: var(--fluida-weight-semibold);
  color: var(--fluida-body);
}
</style>
