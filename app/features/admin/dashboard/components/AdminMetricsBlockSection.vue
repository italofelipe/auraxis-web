<script setup lang="ts">
/**
 * Presentational scaffolding shared by the four dashboard blocks:
 * heading row, KPI tile grid and a chart panel with explicit
 * loading / error / empty states. Data fetching stays in the callers.
 */
import type { Component } from "vue";

import type { AdminMetricsTile } from "~/features/admin/dashboard/model/admin-metrics";

const props = withDefaults(
  defineProps<{
    /** Stable id used for the section heading (aria-labelledby). */
    blockId: string;
    /** Block heading (e.g. "Usuários & crescimento"). */
    title: string;
    /** Lucide icon rendered beside the heading. */
    icon?: Component;
    /** KPI tiles for the block. */
    tiles: readonly AdminMetricsTile[];
    /** True while the overview (tiles) is loading. */
    loading?: boolean;
    /** Chart panel title. */
    chartTitle: string;
    /** Chart panel subtitle. */
    chartSubtitle?: string;
    /** True while the chart series is loading. */
    chartLoading?: boolean;
    /** Error message when the chart series failed to load. */
    chartError?: string | null;
    /** True when the chart series loaded but has no points. */
    chartEmpty?: boolean;
    /** Chart panel body height. */
    chartHeight?: string;
  }>(),
  {
    icon: undefined,
    loading: false,
    chartSubtitle: undefined,
    chartLoading: false,
    chartError: null,
    chartEmpty: false,
    chartHeight: "260px",
  },
);

const emit = defineEmits<{ (e: "retry-chart"): void }>();

/** Forwards the retry intent to the owning block. */
const onRetryChart = (): void => {
  emit("retry-chart");
};
</script>

<template>
  <section
    class="admin-metrics-block"
    :aria-labelledby="`${props.blockId}-title`"
    :data-testid="props.blockId"
  >
    <header class="admin-metrics-block__header">
      <h3 :id="`${props.blockId}-title`" class="admin-metrics-block__title">
        <component :is="props.icon" v-if="props.icon" :size="18" aria-hidden="true" />
        {{ props.title }}
      </h3>
      <slot name="badge" />
    </header>

    <div class="admin-metrics-block__tiles" role="list">
      <div
        v-for="tile in props.tiles"
        :key="tile.label"
        role="listitem"
        class="admin-metrics-block__tile"
        :class="{ 'admin-metrics-block__tile--highlight': tile.highlight }"
      >
        <UiMetricCard :label="tile.label" :value="tile.value" :loading="props.loading" />
      </div>
    </div>

    <UiChartPanel
      :title="props.chartTitle"
      :subtitle="props.chartSubtitle"
      :loading="props.chartLoading"
      :chart-height="props.chartHeight"
    >
      <UiInlineError
        v-if="props.chartError"
        title="Não foi possível carregar a série"
        :message="props.chartError"
        retry-label="Tentar novamente"
        @retry="onRetryChart"
      />
      <UiEmptyState
        v-else-if="props.chartEmpty"
        compact
        title="Sem dados no período"
        description="A série ainda não tem pontos para a janela consultada."
      />
      <slot v-else name="chart" />
    </UiChartPanel>

    <slot name="extra" />
  </section>
</template>

<style scoped>
.admin-metrics-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.admin-metrics-block__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.admin-metrics-block__title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.admin-metrics-block__title svg {
  color: var(--color-brand-700);
}

.admin-metrics-block__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: var(--space-2);
}

.admin-metrics-block__tile--highlight :deep(.ui-metric-card) {
  border-color: var(--color-brand-700);
  box-shadow: 0 0 14px var(--color-brand-glow-xs);
}
</style>
