<script setup lang="ts">
import { NTag } from "naive-ui";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiMetricCard from "~/components/ui/UiMetricCard/UiMetricCard.vue";

interface MetricItem {
  label: string
  value: string
  trend?: number
}

interface Props {
  /** Main label shown above the result value, e.g. "Recomendação" */
  label: string
  /** Result value, e.g. "Parcelado" */
  value: string
  /** Optional explanation displayed below the hero */
  reason?: string
  /** Naive UI NTag type for the badge. Omit to hide the badge */
  badge?: "success" | "warning" | "info" | "default"
  /** List of secondary metrics rendered in a grid below the hero */
  metrics?: ReadonlyArray<MetricItem>
}

const props = withDefaults(defineProps<Props>(), {
  reason: undefined,
  badge: undefined,
  metrics: () => [],
});
</script>

<template>
  <UiGlassPanel
    glow
    class="calculator-result-summary"
  >
    <div class="calculator-result-summary__hero">
      <div class="calculator-result-summary__hero-text">
        <span class="calculator-result-summary__label">{{ props.label }}</span>
        <span class="calculator-result-summary__value">{{ props.value }}</span>
      </div>

      <NTag
        v-if="props.badge"
        :type="props.badge"
        size="large"
        round
        class="calculator-result-summary__badge"
      >
        {{ props.value }}
      </NTag>
    </div>

    <p
      v-if="props.reason"
      class="calculator-result-summary__reason"
    >
      {{ props.reason }}
    </p>

    <div
      v-if="props.metrics && props.metrics.length > 0"
      class="calculator-result-summary__metrics"
    >
      <UiMetricCard
        v-for="metric in props.metrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :trend="metric.trend"
      />
    </div>
  </UiGlassPanel>
</template>

<style scoped>
.calculator-result-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.calculator-result-summary__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.calculator-result-summary__hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.calculator-result-summary__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calculator-result-summary__value {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.calculator-result-summary__reason {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.calculator-result-summary__metrics {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

@media (max-width: 767px) {
  .calculator-result-summary__hero {
    flex-direction: column;
  }

  .calculator-result-summary__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
