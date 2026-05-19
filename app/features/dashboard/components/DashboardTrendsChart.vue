<script setup lang="ts">
import { NButton } from "naive-ui";
import type { EChartsOption } from "echarts";
import type { DashboardTrendsMonthEntry } from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";
import { useLocaleDateFormat } from "~/composables/useLocaleDateFormat";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";

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
const { formatMonthYear } = useLocaleDateFormat();
const { resolvedTheme } = useTheme();

const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const MONTHS_OPTIONS = [
  { label: t("pages.dashboard.trends.months3"), value: 3 },
  { label: t("pages.dashboard.trends.months6"), value: 6 },
  { label: t("pages.dashboard.trends.months12"), value: 12 },
];

/**
 * Formats a "YYYY-MM" string as a short localized label like "Abr/26".
 * Uses the active locale from useI18n instead of a hardcoded locale.
 *
 * @param month ISO month string (YYYY-MM).
 * @returns Short localized month label.
 */
const formatMonthLabel = (month: string): string => {
  const [year, mon] = month.split("-");
  if (!year || !mon) {return month;}
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return formatMonthYear(date);
};

/**
 * Builds the ECharts option from the trends series.
 */
const chartOption = computed((): EChartsOption => {
  const labels = props.series.map((p) => formatMonthLabel(p.month));

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: chartTokens.value.tooltipBackground,
      borderColor: chartTokens.value.tooltipBorder,
      textStyle: { color: chartTokens.value.tooltipText },
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
      textStyle: { color: chartTokens.value.mutedText, fontSize: 11 },
    },
    grid: { left: 8, right: 8, top: 16, bottom: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: chartTokens.value.mutedText, fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: chartTokens.value.border } },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: chartTokens.value.grid, type: "dashed" } },
      axisLabel: {
        color: chartTokens.value.mutedText,
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
        itemStyle: { color: chartTokens.value.income, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t("pages.dashboard.trends.expenses"),
        type: "bar",
        barMaxWidth: 24,
        data: props.series.map((p) => p.expenses),
        itemStyle: { color: chartTokens.value.expense, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t("pages.dashboard.trends.balance"),
        type: "line",
        data: props.series.map((p) => p.balance),
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: chartTokens.value.balance, width: 2 },
        itemStyle: { color: chartTokens.value.balance },
        areaStyle: { color: withAlpha(chartTokens.value.balance, 0.06) },
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
    <template #actions>
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
  color: var(--color-bg-base);
}
</style>
