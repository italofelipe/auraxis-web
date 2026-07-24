<script setup lang="ts">
/**
 * Product-metrics dashboard for `/admin` (issue #1158).
 *
 * Fetches the aggregated overview once and renders the four decided blocks —
 * Usuários & crescimento, Premium & conversão, Uso de IA & custo and
 * Atividade do produto. Each block loads its own timeseries so a failing
 * chart never blanks the whole page, and an overview failure keeps the
 * blocks visible with an explicit error banner (no placeholder masking).
 */
import { computed } from "vue";

import {
  formatGeneratedAt,
  metricsDateRange,
} from "~/features/admin/dashboard/model/admin-metrics";
import { useAdminMetricsOverviewQuery } from "~/features/admin/dashboard/queries/use-admin-metrics-overview";
import AdminMetricsActivityBlock from "./AdminMetricsActivityBlock.vue";
import AdminMetricsAiBlock from "./AdminMetricsAiBlock.vue";
import AdminMetricsPremiumBlock from "./AdminMetricsPremiumBlock.vue";
import AdminMetricsUsersBlock from "./AdminMetricsUsersBlock.vue";

/** 30-day chart window anchored at page load (route is client-side only). */
const range = metricsDateRange(new Date(), 30);

const overviewQuery = useAdminMetricsOverviewQuery();

const overview = computed(() => overviewQuery.data.value ?? null);
const overviewLoading = computed(() => overviewQuery.isPending.value);
const overviewError = computed(() => overviewQuery.error.value?.message ?? null);
const generatedAtLabel = computed(() => {
  const generatedAt = overview.value?.generatedAt;

  return generatedAt ? formatGeneratedAt(generatedAt) : "";
});

/** Re-fetches the aggregated overview after a failure. */
const retryOverview = (): void => {
  void overviewQuery.refetch();
};
</script>

<template>
  <section class="admin-metrics" aria-label="Métricas de produto" data-testid="admin-metrics">
    <UiInlineError
      v-if="overviewError"
      data-testid="admin-metrics-overview-error"
      title="Não foi possível carregar os indicadores"
      :message="overviewError"
      retry-label="Tentar novamente"
      @retry="retryOverview"
    />
    <p v-else-if="generatedAtLabel" class="admin-metrics__meta">
      Indicadores agregados às {{ generatedAtLabel }} · janela dos gráficos: últimos 30 dias.
    </p>

    <AdminMetricsUsersBlock
      :metrics="overview?.users ?? null"
      :loading="overviewLoading"
      :range="range"
    />
    <AdminMetricsPremiumBlock
      :metrics="overview?.premium ?? null"
      :loading="overviewLoading"
      :range="range"
    />
    <AdminMetricsAiBlock
      :metrics="overview?.ai ?? null"
      :loading="overviewLoading"
      :range="range"
    />
    <AdminMetricsActivityBlock
      :metrics="overview?.activity ?? null"
      :loading="overviewLoading"
      :range="range"
    />
  </section>
</template>

<style scoped>
.admin-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-metrics__meta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
