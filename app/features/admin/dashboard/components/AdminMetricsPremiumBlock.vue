<script setup lang="ts">
/** "Premium & conversão" block: KPI tiles + subscriptions vs. overrides line chart. */
import { computed } from "vue";
import { Crown } from "lucide-vue-next";

import { useTheme } from "~/composables/useTheme";
import {
  buildMultiLineOption,
  formatMetricInt,
  formatMetricPct,
  seriesDateLabels,
  seriesValues,
  type AdminMetricsDateRange,
  type AdminMetricsTile,
  type AdminPremiumMetrics,
} from "~/features/admin/dashboard/model/admin-metrics";
import { useAdminMetricsTimeseriesQuery } from "~/features/admin/dashboard/queries/use-admin-metrics-timeseries";
import { buildChartThemeTokens } from "~/utils/chart-theme";
import AdminMetricsBlockSection from "./AdminMetricsBlockSection.vue";

const props = defineProps<{
  /** Premium slice of the overview; null while loading. */
  metrics: AdminPremiumMetrics | null;
  /** True while the overview is loading. */
  loading: boolean;
  /** Window shared by every dashboard chart. */
  range: AdminMetricsDateRange;
}>();

const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const seriesQuery = useAdminMetricsTimeseriesQuery("premium", () => ({
  from: props.range.from,
  to: props.range.to,
  interval: "day" as const,
}));

const tiles = computed((): AdminMetricsTile[] => {
  const premium = props.metrics;

  return [
    {
      label: "Assinaturas ativas",
      value: premium ? formatMetricInt(premium.subscriptionsActive) : "—",
    },
    { label: "Trials ativos", value: premium ? formatMetricInt(premium.trialsActive) : "—" },
    { label: "Overrides ativos", value: premium ? formatMetricInt(premium.overridesActive) : "—" },
    { label: "Usuários entitled", value: premium ? formatMetricInt(premium.entitledUsers) : "—" },
    {
      label: "Novas assinaturas 30d",
      value: premium ? formatMetricInt(premium.newSubscriptions30d) : "—",
    },
    { label: "Conversão", value: premium ? formatMetricPct(premium.conversionPct) : "—" },
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

  return buildMultiLineOption({
    labels: seriesDateLabels(series),
    series: [
      {
        name: "Novas assinaturas",
        values: seriesValues(series, "new_subscriptions"),
        color: chartTokens.value.investment,
      },
      {
        name: "Overrides concedidos",
        values: seriesValues(series, "overrides_granted"),
        color: chartTokens.value.debt,
      },
    ],
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
    block-id="admin-metrics-premium"
    title="Premium & conversão"
    :icon="Crown"
    :tiles="tiles"
    :loading="props.loading"
    chart-title="Assinaturas e overrides por dia"
    chart-subtitle="Últimos 30 dias"
    :chart-loading="seriesQuery.isPending.value"
    :chart-error="seriesQuery.error.value?.message ?? null"
    :chart-empty="chartEmpty"
    @retry-chart="retryChart"
  >
    <template #chart>
      <div v-if="chartOption" role="img" aria-label="Linhas diárias de novas assinaturas e overrides premium dos últimos 30 dias">
      <UiChart
        :option="chartOption"
        :update-key="chartUpdateKey"
        height="260px"
      />
      </div>
    </template>
  </AdminMetricsBlockSection>
</template>
