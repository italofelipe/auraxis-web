<script setup lang="ts">
/** "Usuários & crescimento" block: KPI tiles + signups vs. active users line chart. */
import { computed } from "vue";
import { Users } from "lucide-vue-next";

import { useTheme } from "~/composables/useTheme";
import {
  buildMultiLineOption,
  formatMetricInt,
  isActiveSourceProxy,
  seriesDateLabels,
  seriesValues,
  type AdminMetricsDateRange,
  type AdminMetricsTile,
  type AdminUsersMetrics,
} from "~/features/admin/dashboard/model/admin-metrics";
import { useAdminMetricsTimeseriesQuery } from "~/features/admin/dashboard/queries/use-admin-metrics-timeseries";
import { buildChartThemeTokens } from "~/utils/chart-theme";
import AdminMetricsBlockSection from "./AdminMetricsBlockSection.vue";

const props = defineProps<{
  /** Users slice of the overview; null while loading. */
  metrics: AdminUsersMetrics | null;
  /** True while the overview is loading. */
  loading: boolean;
  /** Window shared by every dashboard chart. */
  range: AdminMetricsDateRange;
}>();

const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const seriesQuery = useAdminMetricsTimeseriesQuery("users", () => ({
  from: props.range.from,
  to: props.range.to,
  interval: "day" as const,
}));

const tiles = computed((): AdminMetricsTile[] => {
  const users = props.metrics;

  return [
    { label: "Total de usuários", value: users ? formatMetricInt(users.total) : "—" },
    { label: "Verificados", value: users ? formatMetricInt(users.verified) : "—" },
    { label: "Ativos 7d", value: users ? formatMetricInt(users.active7d) : "—" },
    { label: "Ativos 30d", value: users ? formatMetricInt(users.active30d) : "—" },
    { label: "Novos 30d", value: users ? formatMetricInt(users.new30d) : "—" },
    { label: "Bloqueados", value: users ? formatMetricInt(users.blocked) : "—" },
  ];
});

const showProxyBadge = computed(
  () => props.metrics !== null && isActiveSourceProxy(props.metrics.activeSource),
);

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
      { name: "Cadastros", values: seriesValues(series, "signups"), color: chartTokens.value.balance },
      {
        name: "Ativos",
        values: seriesValues(series, "active_users"),
        color: chartTokens.value.investment,
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
    block-id="admin-metrics-users"
    title="Usuários & crescimento"
    :icon="Users"
    :tiles="tiles"
    :loading="props.loading"
    chart-title="Cadastros e ativos por dia"
    chart-subtitle="Últimos 30 dias"
    :chart-loading="seriesQuery.isPending.value"
    :chart-error="seriesQuery.error.value?.message ?? null"
    :chart-empty="chartEmpty"
    @retry-chart="retryChart"
  >
    <template #badge>
      <span
        v-if="showProxyBadge"
        class="admin-metrics-users__proxy"
        data-testid="admin-metrics-active-proxy"
      >
        ativos ≈ por sessões (proxy)
        <UiInfoTooltip
          content="Enquanto não há eventos de uso primários, usuários ativos são aproximados pelas renovações de sessão (refresh tokens). O número tende a subestimar sessões longas."
          label="Como o ativo é medido"
        />
      </span>
    </template>

    <template #chart>
      <div v-if="chartOption" role="img" aria-label="Linhas diárias de cadastros e usuários ativos dos últimos 30 dias">
      <UiChart
        :option="chartOption"
        :update-key="chartUpdateKey"
        height="260px"
      />
      </div>
    </template>
  </AdminMetricsBlockSection>
</template>

<style scoped>
.admin-metrics-users__proxy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
</style>
