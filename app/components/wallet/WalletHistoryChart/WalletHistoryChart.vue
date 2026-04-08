<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import { formatCurrency } from "~/utils/currency";
import { useWalletHistoryQuery } from "~/features/wallet/queries/use-wallet-history-query";

interface Props {
  /** Wallet entry UUID to fetch history for. Null hides the chart. */
  readonly entryId: string | null;
  /** Display name of the entry — used in chart title. */
  readonly entryName?: string;
}

const props = defineProps<Props>();

const entryIdRef = computed(() => props.entryId);

const { data: history, isLoading, isError } = useWalletHistoryQuery(entryIdRef);

const hasData = computed(() => (history.value?.length ?? 0) > 0);

const chartOption = computed((): EChartsOption => {
  const points = history.value ?? [];
  return {
    legend: { data: ["Valor atual", "Investido"] },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: unknown) => formatCurrency(v as number),
    },
    xAxis: {
      type: "category",
      data: points.map((p) => p.date),
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => formatCurrency(v) },
    },
    series: [
      {
        name: "Valor atual",
        type: "line",
        data: points.map((p) => p.total_value),
        smooth: true,
        itemStyle: { color: "var(--color-brand-600)" },
      },
      {
        name: "Investido",
        type: "line",
        data: points.map((p) => p.invested_amount),
        smooth: true,
        lineStyle: { type: "dashed" },
        itemStyle: { color: "var(--color-text-muted)" },
      },
    ],
  };
});
</script>

<template>
  <div class="wallet-history-chart">
    <span v-if="props.entryName" class="wallet-history-chart__title">
      {{ props.entryName }}
    </span>

    <BaseSkeleton
      v-if="isLoading"
      class="wallet-history-chart__skeleton"
    />

    <p
      v-else-if="isError || !hasData"
      class="wallet-history-chart__unavailable"
    >
      Histórico não disponível
    </p>

    <UiChart
      v-else
      :option="chartOption"
      height="160px"
    />
  </div>
</template>

<style scoped>
.wallet-history-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.wallet-history-chart__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.wallet-history-chart__skeleton {
  height: 160px;
  border-radius: var(--radius-md);
}

.wallet-history-chart__unavailable {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-4) 0;
}
</style>
