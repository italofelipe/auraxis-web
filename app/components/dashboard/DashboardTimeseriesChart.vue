<script setup lang="ts">
import { computed } from "vue";
import { BarChart2 } from "lucide-vue-next";

import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";
import { useChartSeriesMapper } from "~/features/dashboard/composables/useChartSeriesMapper";

interface Props {
  data: DashboardTimeseriesPoint[];
  isLoading?: boolean;
}


const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const { mapTimeseries } = useChartSeriesMapper();

const mapped = computed(() => mapTimeseries(props.data));

/** Colors derived from design tokens via the chart series mapper. */
const seriesColors = computed(() => {
  const [income, expense, balance] = mapped.value.series;
  return {
    income: income?.color ?? "",
    expense: expense?.color ?? "",
    balance: balance?.color ?? "",
  };
});

/**
 * Computes proportional bar widths for the inline timeseries visualization.
 *
 * @param point The timeseries data point to render.
 * @returns Width style objects for income, expense and balance bars.
 */
const barStyles = (
  point: DashboardTimeseriesPoint,
): Record<"income" | "expense" | "balance", { width: string }> => {
  const max = Math.max(
    ...props.data.flatMap((item) => [item.income, item.expense, Math.abs(item.balance)]),
    1,
  );
  return {
    income: { width: `${(point.income / max) * 100}%` },
    expense: { width: `${(point.expense / max) * 100}%` },
    balance: { width: `${(Math.abs(point.balance) / max) * 100}%` },
  };
};

/**
 * Formats an ISO date string to a compact PT-BR label.
 *
 * @param value ISO calendar date string.
 * @returns Localized compact date label.
 */
const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};
</script>

<template>
  <UiBaseCard :title="$t('dashboard.timeseries.title')">
    <BaseSkeleton v-if="props.isLoading" style="height: 120px" />

    <div v-else-if="props.data.length === 0" class="timeseries-empty">
      <BarChart2 class="timeseries-empty__icon" :size="32" aria-hidden="true" />
      <p>{{ $t('dashboard.timeseries.emptyTitle') }}</p>
      <small>{{ $t('dashboard.timeseries.emptyDescription') }}</small>
    </div>

    <div v-else class="series-list" role="list" :aria-label="$t('dashboard.timeseries.listAriaLabel')">
      <div
        v-for="point in props.data"
        :key="point.date"
        class="series-item"
        role="listitem"
      >
        <div class="series-item__header">
          <strong>{{ formatDate(point.date) }}</strong>
          <span>{{ formatCurrency(point.balance) }}</span>
        </div>
        <div class="series-bars" aria-hidden="true">
          <span class="series-bars__income" :style="{ ...barStyles(point).income, background: seriesColors.income }" />
          <span class="series-bars__expense" :style="{ ...barStyles(point).expense, background: seriesColors.expense }" />
          <span class="series-bars__balance" :style="{ ...barStyles(point).balance, background: seriesColors.balance }" />
        </div>
      </div>
    </div>
  </UiBaseCard>
</template>

<style scoped>
.timeseries-empty {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  padding-block: var(--space-3);
  text-align: center;
  color: var(--color-neutral-600);
}

.timeseries-empty__icon {
  color: var(--color-neutral-400);
}

.timeseries-empty p {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
}

.timeseries-empty small {
  color: var(--color-neutral-600);
}

.series-list {
  display: grid;
  gap: var(--space-2);
}

.series-item {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.45);
}

.series-item__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  align-items: flex-start;
}

.series-bars {
  display: grid;
  gap: 6px;
  margin-top: var(--space-2);
}

.series-bars span {
  display: block;
  height: 10px;
  border-radius: var(--radius-lg);
}

</style>
