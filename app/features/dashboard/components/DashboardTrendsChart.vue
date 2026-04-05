<script setup lang="ts">
import { NButton } from "naive-ui";
import type { EChartsOption } from "echarts";
import type { DashboardTrendsMonthEntry } from "~/features/dashboard/model/dashboard-overview";
import { colors } from "~/theme/tokens/colors";
import { formatCurrency } from "~/utils/currency";

/** Props */
const props = defineProps<{
  /** Multi-month income/expense series from the trends query. */
  series: DashboardTrendsMonthEntry[];
  /** Whether the trends query is loading. */
  loading?: boolean;
  /** Whether the trends query returned an error. */
  isError?: boolean;
  /** Selected number of months window. */
  selectedMonths: number;
}>();

const emit = defineEmits<{
  /** Emitted when the user changes the months selector. */
  (e: "update:selectedMonths", months: number): void;
  /** Emitted when the user requests a retry after an error. */
  (e: "retry"): void;
}>();

const { t } = useI18n();

const MONTHS_OPTIONS = [
  { label: t("pages.dashboard.trends.months3"), value: 3 },
  { label: t("pages.dashboard.trends.months6"), value: 6 },
  { label: t("pages.dashboard.trends.months12"), value: 12 },
];

/**
 * Formats a "YYYY-MM" string as a short localized label like "Abr/26".
 *
 * @param month ISO month string (YYYY-MM).
 * @returns Short localized month label.
 */
const formatMonthLabel = (month: string): string => {
  const [year, mon] = month.split("-");
  if (!year || !mon) {return month;}
  const date = new Date(Number(year), Number(mon) - 1, 1);
  const shortMonth = date.toLocaleDateString("pt-BR", { month: "short" });
  const shortYear = String(date.getFullYear()).slice(-2);
  return `${shortMonth.replace(".", "").charAt(0).toUpperCase()}${shortMonth.replace(".", "").slice(1)}/${shortYear}`;
};

/**
 * Builds the ECharts option from the trends series.
 */
const chartOption = computed((): EChartsOption => {
  const labels = props.series.map((p) => formatMonthLabel(p.month));

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown): string => {
        const items = Array.isArray(params) ? params : [params];
        const lines = (items as Array<{ seriesName: string; value: number; marker: string }>).map(
          (p) => `${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}`,
        );
        return lines.join("<br/>");
      },
    },
    legend: {
      bottom: 0,
      data: [
        t("pages.dashboard.trends.income"),
        t("pages.dashboard.trends.expenses"),
        t("pages.dashboard.trends.balance"),
      ],
      textStyle: { fontSize: 11 },
    },
    grid: { left: 8, right: 8, top: 16, bottom: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed" } },
      axisLabel: {
        fontSize: 10,
        formatter: (v: number) => formatCurrency(v),
      },
    },
    series: [
      {
        name: t("pages.dashboard.trends.income"),
        type: "bar",
        barMaxWidth: 24,
        data: props.series.map((p) => p.income),
        itemStyle: { color: colors.positive.DEFAULT, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t("pages.dashboard.trends.expenses"),
        type: "bar",
        barMaxWidth: 24,
        data: props.series.map((p) => p.expenses),
        itemStyle: { color: colors.negative.DEFAULT, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t("pages.dashboard.trends.balance"),
        type: "line",
        data: props.series.map((p) => p.balance),
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: colors.brand["500"], width: 2 },
        itemStyle: { color: colors.brand["500"] },
        areaStyle: { color: colors.brand["500"], opacity: 0.06 },
      },
    ],
  };
});
</script>

<template>
  <UiChartPanel
    :title="$t('pages.dashboard.trends.title')"
    :loading="props.loading"
    chart-height="300px"
  >
    <template #header-actions>
      <div class="trends-month-selector">
        <button
          v-for="opt in MONTHS_OPTIONS"
          :key="opt.value"
          class="trends-month-btn"
          :class="{ 'trends-month-btn--active': props.selectedMonths === opt.value }"
          type="button"
          @click="emit('update:selectedMonths', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </template>

    <UiEmptyState
      v-if="props.isError"
      icon="warning"
      :title="$t('pages.dashboard.loadError')"
      :compact="true"
    >
      <NButton size="small" type="default" @click="emit('retry')">
        {{ $t('pages.dashboard.retry') }}
      </NButton>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="!props.loading && props.series.length === 0"
      icon="chartLine"
      :title="$t('pages.dashboard.trends.emptyState')"
      :compact="true"
    />

    <UiChart
      v-else
      :option="chartOption"
      :update-key="props.series.length + props.selectedMonths"
      height="300px"
    />
  </UiChartPanel>
</template>

<style scoped>
.trends-month-selector {
  display: flex;
  gap: var(--space-1);
}

.trends-month-btn {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.trends-month-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.trends-month-btn--active {
  background: var(--color-brand-600);
  border-color: var(--color-brand-600);
  color: #fff;
}
</style>
