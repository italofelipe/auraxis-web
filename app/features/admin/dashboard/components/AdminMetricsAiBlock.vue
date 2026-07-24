<script setup lang="ts">
/**
 * "Uso de IA & custo" block: KPI tiles (MTD cost highlighted), daily USD cost
 * bar chart and a per-model breakdown table (the chart's accessible twin).
 */
import { computed } from "vue";
import { Sparkles } from "lucide-vue-next";

import { useTheme } from "~/composables/useTheme";
import {
  buildBarOption,
  formatCompactInt,
  formatLatency,
  formatMetricInt,
  formatUsd,
  seriesDateLabels,
  seriesValues,
  type AdminAiMetrics,
  type AdminMetricsDateRange,
  type AdminMetricsTile,
} from "~/features/admin/dashboard/model/admin-metrics";
import { useAdminAiBreakdownQuery } from "~/features/admin/dashboard/queries/use-admin-ai-breakdown";
import { useAdminMetricsTimeseriesQuery } from "~/features/admin/dashboard/queries/use-admin-metrics-timeseries";
import { buildChartThemeTokens } from "~/utils/chart-theme";
import AdminMetricsBlockSection from "./AdminMetricsBlockSection.vue";

const props = defineProps<{
  /** AI slice of the overview; null while loading. */
  metrics: AdminAiMetrics | null;
  /** True while the overview is loading. */
  loading: boolean;
  /** Window shared by every dashboard chart. */
  range: AdminMetricsDateRange;
}>();

const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const seriesQuery = useAdminMetricsTimeseriesQuery("ai", () => ({
  from: props.range.from,
  to: props.range.to,
  interval: "day" as const,
}));

const breakdownQuery = useAdminAiBreakdownQuery({ by: "model", limit: 5 });

const tiles = computed((): AdminMetricsTile[] => {
  const ai = props.metrics;

  return [
    { label: "Custo no mês (MTD)", value: ai ? formatUsd(ai.costUsdMtd) : "—", highlight: true },
    { label: "Custo 7d", value: ai ? formatUsd(ai.costUsd7d) : "—" },
    { label: "Chamadas 7d", value: ai ? formatMetricInt(ai.calls7d) : "—" },
    { label: "Tokens 7d", value: ai ? formatCompactInt(ai.tokens7d) : "—" },
    { label: "Latência média 7d", value: ai ? formatLatency(ai.avgLatencyMs7d) : "—" },
    { label: "Usuários com IA 7d", value: ai ? formatMetricInt(ai.activeUsers7d) : "—" },
  ];
});

const chartEmpty = computed(
  () => seriesQuery.data.value !== undefined && seriesQuery.data.value.points.length === 0,
);

const chartOption = computed(() => {
  const series = seriesQuery.data.value;
  if (!series) {
    return null;
  }

  return buildBarOption({
    labels: seriesDateLabels(series),
    name: "Custo (US$)",
    values: seriesValues(series, "cost_usd"),
    color: chartTokens.value.investment,
    tokens: chartTokens.value,
    valueFormatter: formatUsd,
  });
});

const chartUpdateKey = computed(() => {
  const series = seriesQuery.data.value;

  return series ? `${resolvedTheme.value}-${series.points.length}-${series.points.at(-1)?.date}` : "";
});

const breakdownRows = computed(() => breakdownQuery.data.value?.rows ?? []);

/** Re-fetches the block series after a failure. */
const retryChart = (): void => {
  void seriesQuery.refetch();
};

/** Re-fetches the model breakdown after a failure. */
const retryBreakdown = (): void => {
  void breakdownQuery.refetch();
};
</script>

<template>
  <AdminMetricsBlockSection
    block-id="admin-metrics-ai"
    title="Uso de IA & custo"
    :icon="Sparkles"
    :tiles="tiles"
    :loading="props.loading"
    chart-title="Custo de IA por dia"
    chart-subtitle="US$ · últimos 30 dias"
    :chart-loading="seriesQuery.isPending.value"
    :chart-error="seriesQuery.error.value?.message ?? null"
    :chart-empty="chartEmpty"
    @retry-chart="retryChart"
  >
    <template #chart>
      <div v-if="chartOption" role="img" aria-label="Barras diárias do custo de IA em dólares dos últimos 30 dias">
      <UiChart
        :option="chartOption"
        :update-key="chartUpdateKey"
        height="260px"
      />
      </div>
    </template>

    <template #extra>
      <UiSurfaceCard class="admin-metrics-ai__breakdown" data-testid="admin-metrics-ai-breakdown">
        <h4>Top modelos (7d)</h4>

        <BaseSkeleton v-if="breakdownQuery.isPending.value" variant="line" :repeat="3" />
        <UiInlineError
          v-else-if="breakdownQuery.error.value"
          title="Não foi possível carregar o breakdown"
          :message="breakdownQuery.error.value.message"
          retry-label="Tentar novamente"
          @retry="retryBreakdown"
        />
        <p v-else-if="breakdownRows.length === 0" class="admin-metrics-ai__empty">
          Sem uso de IA registrado no período.
        </p>
        <div v-else class="admin-metrics-ai__table-wrap">
          <table class="admin-metrics-ai__table">
            <thead>
              <tr>
                <th scope="col">Modelo</th>
                <th scope="col">Chamadas</th>
                <th scope="col">Tokens</th>
                <th scope="col">Custo</th>
                <th scope="col">Latência média</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in breakdownRows" :key="row.key">
                <th scope="row">{{ row.key }}</th>
                <td>{{ formatMetricInt(row.calls) }}</td>
                <td>{{ formatCompactInt(row.tokens) }}</td>
                <td>{{ formatUsd(row.costUsd) }}</td>
                <td>{{ formatLatency(row.avgLatencyMs) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiSurfaceCard>
    </template>
  </AdminMetricsBlockSection>
</template>

<style scoped>
.admin-metrics-ai__breakdown h4 {
  margin: 0 0 var(--space-2);
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.admin-metrics-ai__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.admin-metrics-ai__table-wrap {
  overflow-x: auto;
}

.admin-metrics-ai__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.admin-metrics-ai__table th,
.admin-metrics-ai__table td {
  padding: 8px 12px;
  text-align: right;
  border-bottom: 1px solid var(--color-outline-soft);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.admin-metrics-ai__table th[scope="col"]:first-child,
.admin-metrics-ai__table th[scope="row"] {
  text-align: left;
}

.admin-metrics-ai__table thead th {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.admin-metrics-ai__table tbody tr:last-child th,
.admin-metrics-ai__table tbody tr:last-child td {
  border-bottom: none;
}
</style>
