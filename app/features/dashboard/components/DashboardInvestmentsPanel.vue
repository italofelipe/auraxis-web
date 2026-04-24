<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import { Briefcase } from "lucide-vue-next";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiTrendBadge from "~/components/ui/UiTrendBadge/UiTrendBadge.vue";
import { formatCurrency } from "~/utils/currency";
import { colors } from "~/theme/tokens/colors";

const props = defineProps<{
  entries: readonly WalletEntryDto[];
  loading?: boolean;
}>();

const { t } = useI18n();

const ASSET_COLORS: Record<WalletEntryDto["asset_type"], string> = {
  stock: colors.cyan[500],
  fii: colors.violet[500],
  crypto: colors.orange[500],
  fixed_income: colors.lime[500],
  other: colors.neutral[650],
};

interface AllocationBucket {
  readonly key: WalletEntryDto["asset_type"];
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const allocation = computed<AllocationBucket[]>(() => {
  const buckets = new Map<WalletEntryDto["asset_type"], number>();
  for (const entry of props.entries) {
    const prev = buckets.get(entry.asset_type) ?? 0;
    buckets.set(entry.asset_type, prev + entry.current_value);
  }
  const keys: WalletEntryDto["asset_type"][] = ["stock", "fii", "crypto", "fixed_income", "other"];
  return keys
    .map((key) => ({
      key,
      label: t(`pages.dashboard.investments.assetTypes.${key}`),
      value: buckets.get(key) ?? 0,
      color: ASSET_COLORS[key],
    }))
    .filter((b) => b.value > 0);
});

const totalInvested = computed(() =>
  props.entries.reduce((sum, e) => sum + (e.cost_basis ?? e.current_value), 0),
);
const totalCurrent = computed(() =>
  props.entries.reduce((sum, e) => sum + e.current_value, 0),
);
const totalProfit = computed(() => totalCurrent.value - totalInvested.value);
const profitPercent = computed(() => {
  if (totalInvested.value <= 0) {return null;}
  return (totalProfit.value / totalInvested.value) * 100;
});

const hasData = computed(() => allocation.value.length > 0);

const chartOption = computed((): EChartsOption => ({
  tooltip: {
    trigger: "item",
    formatter: (params: unknown): string => {
      const p = params as { name: string; value: number; percent: number };
      return `${p.name}: ${formatCurrency(p.value)} (${p.percent.toFixed(1)}%)`;
    },
  },
  legend: { show: false },
  series: [
    {
      type: "pie",
      radius: ["55%", "80%"],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: allocation.value.map((b) => ({
        name: b.label,
        value: b.value,
        itemStyle: { color: b.color, borderRadius: 4, borderWidth: 2, borderColor: colors.bg.surface },
      })),
    },
  ],
}));
</script>

<template>
  <UiSurfaceCard class="investments-panel">
    <header class="investments-panel__header">
      <div class="investments-panel__title-group">
        <Briefcase :size="16" aria-hidden="true" />
        <h3 class="investments-panel__title">
          {{ $t('pages.dashboard.investments.title') }}
        </h3>
      </div>
      <p class="investments-panel__subtitle">
        {{ $t('pages.dashboard.investments.subtitle') }}
      </p>
    </header>

    <div v-if="props.loading" class="investments-panel__skeleton" aria-busy="true" />

    <div v-else-if="!hasData" class="investments-panel__empty">
      <p>{{ $t('pages.dashboard.investments.emptyTitle') }}</p>
      <small>{{ $t('pages.dashboard.investments.emptyDescription') }}</small>
    </div>

    <div v-else class="investments-panel__body">
      <div class="investments-panel__chart">
        <ClientOnly>
          <UiChart
            :option="chartOption"
            :update-key="allocation.length + totalCurrent"
            height="180px"
          />
        </ClientOnly>
        <div class="investments-panel__chart-overlay">
          <span class="investments-panel__chart-label">
            {{ $t('pages.dashboard.investments.totalLabel') }}
          </span>
          <strong class="investments-panel__chart-value">
            {{ formatCurrency(totalCurrent) }}
          </strong>
        </div>
      </div>

      <div class="investments-panel__side">
        <div class="investments-panel__metric">
          <span>{{ $t('pages.dashboard.investments.investedLabel') }}</span>
          <strong>{{ formatCurrency(totalInvested) }}</strong>
        </div>
        <div class="investments-panel__metric">
          <span>{{ $t('pages.dashboard.investments.profitLabel') }}</span>
          <div class="investments-panel__metric-value">
            <strong :class="totalProfit >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(totalProfit) }}
            </strong>
            <UiTrendBadge
              v-if="profitPercent !== null"
              :value="profitPercent"
              :decimals="2"
            />
          </div>
        </div>

        <ul class="investments-panel__legend">
          <li v-for="bucket in allocation" :key="bucket.key">
            <span
              class="investments-panel__legend-swatch"
              :style="{ background: bucket.color }"
              aria-hidden="true"
            />
            <span class="investments-panel__legend-label">{{ bucket.label }}</span>
            <span class="investments-panel__legend-value">
              {{ formatCurrency(bucket.value) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </UiSurfaceCard>
</template>

<style scoped>
.investments-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.investments-panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.investments-panel__title-group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.investments-panel__title {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}
.investments-panel__subtitle {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.investments-panel__body {
  display: grid;
  grid-template-columns: minmax(160px, 220px) 1fr;
  gap: var(--space-3);
  align-items: center;
}
.investments-panel__chart {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.investments-panel__chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.investments-panel__chart-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.investments-panel__chart-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}
.investments-panel__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.investments-panel__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-size-sm);
}
.investments-panel__metric span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.investments-panel__metric strong {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}
.investments-panel__metric-value {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
}
.investments-panel__metric-value strong.positive { color: var(--color-positive); }
.investments-panel__metric-value strong.negative { color: var(--color-negative); }
.investments-panel__legend {
  list-style: none;
  padding: 0;
  margin: var(--space-1) 0 0;
  display: grid;
  gap: 6px;
}
.investments-panel__legend li {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--font-size-xs);
}
.investments-panel__legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-xs);
}
.investments-panel__legend-label {
  color: var(--color-text-secondary);
}
.investments-panel__legend-value {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}
.investments-panel__empty {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
  padding: var(--space-3) 0;
}
.investments-panel__empty p {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.investments-panel__empty small {
  color: var(--color-text-muted);
}
.investments-panel__skeleton {
  height: 180px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (max-width: 640px) {
  .investments-panel__body {
    grid-template-columns: 1fr;
  }
}
</style>
