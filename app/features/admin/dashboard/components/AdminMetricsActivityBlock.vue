<script setup lang="ts">
/** "Atividade do produto" block: KPI tiles + daily transactions bar chart. */
import { computed } from "vue";
import { Activity } from "lucide-vue-next";

import { useTheme } from "~/composables/useTheme";
import {
  buildBarOption,
  formatMetricInt,
  seriesDateLabels,
  seriesValues,
  type AdminActivityMetrics,
  type AdminMetricsDateRange,
  type AdminMetricsTile,
} from "~/features/admin/dashboard/model/admin-metrics";
import { useAdminMetricsTimeseriesQuery } from "~/features/admin/dashboard/queries/use-admin-metrics-timeseries";
import { buildChartThemeTokens } from "~/utils/chart-theme";
import AdminMetricsBlockSection from "./AdminMetricsBlockSection.vue";

const props = defineProps<{
  /** Activity slice of the overview; null while loading. */
  metrics: AdminActivityMetrics | null;
  /** True while the overview is loading. */
  loading: boolean;
  /** Window shared by every dashboard chart. */
  range: AdminMetricsDateRange;
}>();

const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const seriesQuery = useAdminMetricsTimeseriesQuery("activity", () => ({
  from: props.range.from,
  to: props.range.to,
  interval: "day" as const,
}));

const tiles = computed((): AdminMetricsTile[] => {
  const activity = props.metrics;

  return [
    { label: "Transações 7d", value: activity ? formatMetricInt(activity.transactions7d) : "—" },
    {
      label: "Aportes em metas 7d",
      value: activity ? formatMetricInt(activity.goalContributions7d) : "—",
    },
    { label: "Metas criadas 7d", value: activity ? formatMetricInt(activity.goalsCreated7d) : "—" },
    { label: "Orçamentos ativos", value: activity ? formatMetricInt(activity.budgetsActive) : "—" },
    { label: "Simulações 7d", value: activity ? formatMetricInt(activity.simulations7d) : "—" },
    { label: "Insights 7d", value: activity ? formatMetricInt(activity.insightRuns7d) : "—" },
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
    name: "Transações",
    values: seriesValues(series, "transactions"),
    color: chartTokens.value.balance,
    tokens: chartTokens.value,
    valueFormatter: formatMetricInt,
    integerAxis: true,
  });
});

const chartUpdateKey = computed(() => {
  const series = seriesQuery.data.value;

  return series ? `${resolvedTheme.value}-${series.points.length}-${series.points.at(-1)?.date}` : "";
});

/** Re-fetches the block series after a failure. */
const retryChart = (): void => {
  void seriesQuery.refetch();
};
</script>

<template>
  <AdminMetricsBlockSection
    block-id="admin-metrics-activity"
    title="Atividade do produto"
    :icon="Activity"
    :tiles="tiles"
    :loading="props.loading"
    chart-title="Transações por dia"
    chart-subtitle="Últimos 30 dias"
    :chart-loading="seriesQuery.isPending.value"
    :chart-error="seriesQuery.error.value?.message ?? null"
    :chart-empty="chartEmpty"
    @retry-chart="retryChart"
  >
    <template #chart>
      <div v-if="chartOption" role="img" aria-label="Barras diárias de transações registradas nos últimos 30 dias">
      <UiChart
        :option="chartOption"
        :update-key="chartUpdateKey"
        height="260px"
      />
      </div>
    </template>
  </AdminMetricsBlockSection>
</template>
