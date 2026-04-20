<script setup lang="ts">
import type { UiMetricCardProps } from "./UiMetricCard.types";
import UiSurfaceCard from "../UiSurfaceCard/UiSurfaceCard.vue";
import UiTrendBadge from "../UiTrendBadge/UiTrendBadge.vue";

withDefaults(defineProps<UiMetricCardProps>(), {
  trend: undefined,
  icon: undefined,
  loading: false,
});
</script>

<template>
  <UiSurfaceCard class="ui-metric-card">
    <div v-if="loading" class="ui-metric-card__skeleton" aria-busy="true" />
    <template v-else>
      <div class="ui-metric-card__header">
        <span class="ui-metric-card__label">{{ label }}</span>
        <component
          :is="icon"
          v-if="icon"
          :size="18"
          class="ui-metric-card__icon"
          aria-hidden="true"
        />
      </div>
      <p class="ui-metric-card__value">{{ value }}</p>
      <UiTrendBadge v-if="trend !== undefined" :value="trend" class="ui-metric-card__trend" />
    </template>
  </UiSurfaceCard>
</template>

<style scoped>
.ui-metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  transition: box-shadow var(--motion-standard);
}
.ui-metric-card:hover {
  box-shadow: 0 0 18px var(--color-brand-glow-xs);
}
.ui-metric-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.ui-metric-card__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ui-metric-card__icon { color: var(--color-text-muted); }
.ui-metric-card__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}
.ui-metric-card__trend { margin-top: 2px; }
.ui-metric-card__skeleton {
  height: 80px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
