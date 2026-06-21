<script setup lang="ts">
import type { FluidaStat } from "../model/insight-fluida";

defineProps<{
  tiles: readonly FluidaStat[];
}>();
</script>

<template>
  <div class="fluida-tiles">
    <div v-for="tile in tiles" :key="tile.label" class="fluida-tiles__tile">
      <span class="fluida-tiles__label">{{ tile.label }}</span>
      <span class="fluida-tiles__value">{{ tile.value }}</span>
      <span class="fluida-tiles__caption">{{ tile.caption }}</span>
    </div>
  </div>
</template>

<style scoped>
.fluida-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.fluida-tiles__tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--fluida-radius-card);
  background: var(--fluida-surface);
  box-shadow: var(--fluida-shadow);
}

.fluida-tiles__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--fluida-size-label);
  font-weight: var(--fluida-weight-strong);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fluida-muted);
}

.fluida-tiles__value {
  font-family: var(--fluida-font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--fluida-size-tile-value);
  font-weight: var(--fluida-weight-strong);
  white-space: nowrap;
  color: var(--fluida-ink);
}

.fluida-tiles__caption {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--fluida-size-caption);
  font-weight: var(--fluida-weight-semibold);
  color: var(--fluida-muted);
}

@media (max-width: 720px) {
  .fluida-tiles {
    grid-template-columns: 1fr;
  }
}
</style>
