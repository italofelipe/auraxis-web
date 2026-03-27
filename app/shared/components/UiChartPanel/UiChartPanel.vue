<script setup lang="ts">
import UiSurfaceCard from "../UiSurfaceCard/UiSurfaceCard.vue";
import UiInfoTooltip from "../UiInfoTooltip/UiInfoTooltip.vue";
import type { UiChartPanelProps } from "./UiChartPanel.types";

const props = withDefaults(defineProps<UiChartPanelProps>(), {
  title: undefined,
  subtitle: undefined,
  helper: undefined,
  chartHeight: "280px",
  loading: false,
});

const slots = useSlots();
</script>

<template>
  <UiSurfaceCard class="ui-chart-panel" padding="none">
    <div
      v-if="props.title || slots['actions']"
      class="ui-chart-panel__header"
    >
      <div class="ui-chart-panel__title-group">
        <h3 v-if="props.title" class="ui-chart-panel__title">
          {{ props.title }}
        </h3>
        <p v-if="props.subtitle" class="ui-chart-panel__subtitle">
          {{ props.subtitle }}
        </p>
        <UiInfoTooltip
          v-if="props.helper"
          :content="props.helper"
          label="Saiba mais"
        />
      </div>

      <div v-if="slots['actions']" class="ui-chart-panel__actions">
        <slot name="actions" />
      </div>
    </div>

    <div
      class="ui-chart-panel__body"
      :style="{ minHeight: props.chartHeight }"
    >
      <div
        v-if="props.loading"
        class="ui-chart-panel__skeleton"
        :style="{ height: props.chartHeight }"
        aria-hidden="true"
      />
      <slot v-else />
    </div>

    <div v-if="slots['legend']" class="ui-chart-panel__legend">
      <slot name="legend" />
    </div>
  </UiSurfaceCard>
</template>

<style scoped>
.ui-chart-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ui-chart-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
}

.ui-chart-panel__title-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.ui-chart-panel__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.ui-chart-panel__subtitle {
  width: 100%;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.ui-chart-panel__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-1);
}

.ui-chart-panel__body {
  position: relative;
  padding: var(--space-3);
}

.ui-chart-panel__skeleton {
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  animation: cp-pulse 1.5s ease-in-out infinite;
}

@keyframes cp-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.ui-chart-panel__legend {
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
