<script setup lang="ts">
import { computed } from "vue";

import UiChartPanel from "~/components/ui/UiChartPanel/UiChartPanel.vue";
import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiMetricCard from "~/components/ui/UiMetricCard/UiMetricCard.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { ICON_MAP } from "~/shared/utils/icons/iconMap";
import { PercentFormatter } from "~/shared/utils/formatters/PercentFormatter";
import { formatCurrency } from "~/utils/currency";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { AnalyticsViewModel } from "../model/credit-card-analytics";
import { resolveCardTheme } from "../utils/card-brand-theme";
import { formatCurrencyShort, formatDayMonth } from "../utils/format";
import { monthKeyShort } from "../utils/transaction-billing";
import CreditCardCategoryDonut from "./charts/CreditCardCategoryDonut.vue";
import CreditCardCategoryHBars from "./charts/CreditCardCategoryHBars.vue";
import CreditCardStackedBars from "./charts/CreditCardStackedBars.vue";
import CreditCardMonthSwitcher from "./CreditCardMonthSwitcher.vue";

const props = defineProps<{
  analytics: AnalyticsViewModel;
  cards: readonly CreditCardDto[];
  selectedCardId: string | null;
  monthLabel: string;
  /** Modo cartão único (página de detalhe): esconde os chips de cartão. */
  singleCard?: boolean;
}>();

const emit = defineEmits<{
  "select-card": [cardId: string | null];
  "shift-month": [delta: number];
}>();

const cardById = computed(() => new Map(props.cards.map((card) => [card.id, card])));

/**
 * Cor de marca/banco resolvida para um cartão por id.
 *
 * @param cardId Id do cartão.
 * @returns Cor CSS do cartão.
 */
const colorForCard = (cardId: string): string =>
  resolveCardTheme(cardById.value.get(cardId) ?? { brand: null, bank: null }).color;

const variationValue = computed<string>(() =>
  props.analytics.kpis.variation.pct === null && props.analytics.kpis.billTotal === 0
    ? "—"
    : formatCurrency(props.analytics.kpis.variation.delta),
);
// Para gastos, subir é alerta: vermelho quando o gasto aumenta, verde quando cai.
const variationUp = computed<boolean>(() => (props.analytics.kpis.variation.pct ?? 0) > 0);
const variationPctLabel = computed<string>(() =>
  props.analytics.kpis.variation.pct === null
    ? ""
    : PercentFormatter.format(props.analytics.kpis.variation.pct),
);
const topCategoryLabel = computed<string>(() =>
  props.analytics.kpis.topCategory ? `Maior · ${props.analytics.kpis.topCategory.name}` : "Maior categoria",
);
const topCategoryValue = computed<string>(() =>
  props.analytics.kpis.topCategory ? formatCurrency(props.analytics.kpis.topCategory.total) : "—",
);
const limitUsedValue = computed<string>(() =>
  props.analytics.kpis.limitUsedPct === null
    ? "—"
    : `${Math.round(props.analytics.kpis.limitUsedPct)}%`,
);

const stackedLabels = computed<string[]>(() =>
  props.analytics.monthlySeries.months.map((month) => monthKeyShort(month)),
);
const stackedSeries = computed(() =>
  props.analytics.monthlySeries.series.map((entry) => ({
    name: entry.name,
    color: colorForCard(entry.cardId),
    values: entry.values,
  })),
);

const donutSlices = computed(() =>
  props.analytics.categories.map((category) => ({
    name: category.name,
    value: category.total,
    color: category.color,
  })),
);

const cardHbars = computed(() =>
  props.analytics.cardTotals.map((entry) => ({
    label: entry.name,
    value: entry.total,
    color: colorForCard(entry.cardId),
  })),
);
</script>

<template>
  <div class="ana">
    <header class="ana__filters">
      <div v-if="!singleCard" class="ana__chips">
        <button
          type="button"
          class="ana__chip"
          :class="{ 'ana__chip--active': selectedCardId === null }"
          @click="emit('select-card', null)"
        >
          Todos
        </button>
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="ana__chip"
          :class="{ 'ana__chip--active': selectedCardId === card.id }"
          :style="selectedCardId === card.id ? { background: colorForCard(card.id), borderColor: colorForCard(card.id), color: '#fff' } : {}"
          @click="emit('select-card', card.id)"
        >
          {{ card.name }}
        </button>
      </div>
      <CreditCardMonthSwitcher :month-label="monthLabel" @shift="(delta) => emit('shift-month', delta)" />
    </header>

    <section class="ana__kpis">
      <UiMetricCard label="Fatura do mês" :value="formatCurrency(analytics.kpis.billTotal)" :icon="ICON_MAP.creditCard" />
      <UiSurfaceCard class="ana__var">
        <div class="ana__var-head">
          <span class="ana__var-label">Variação vs anterior</span>
          <UiIcon :name="variationUp ? 'trendingUp' : 'trendingDown'" :size="18" class="ana__var-icon" />
        </div>
        <p class="ana__var-value">{{ variationValue }}</p>
        <span
          v-if="variationPctLabel"
          class="ana__var-badge"
          :class="variationUp ? 'ana__var-badge--bad' : 'ana__var-badge--good'"
        >{{ variationPctLabel }}</span>
      </UiSurfaceCard>
      <UiMetricCard :label="topCategoryLabel" :value="topCategoryValue" :icon="ICON_MAP.pieChart" />
      <UiMetricCard label="Limite usado" :value="limitUsedValue" :icon="ICON_MAP.target" />
    </section>

    <section class="ana__charts">
      <UiChartPanel title="Gastos ao longo do tempo" subtitle="por cartão" chart-height="260px" class="ana__charts-main">
        <CreditCardStackedBars :month-labels="stackedLabels" :series="stackedSeries" />
      </UiChartPanel>

      <UiChartPanel title="Gastos por categoria" chart-height="240px">
        <CreditCardCategoryDonut
          :slices="donutSlices"
          :center-value="formatCurrencyShort(analytics.kpis.billTotal)"
          :center-label="monthKeyShort(analytics.month)"
        />
        <template #legend>
          <span v-for="category in analytics.categories" :key="category.tagId ?? 'none'" class="ana__legend">
            <span class="ana__legend-dot" :style="{ background: category.color }" />
            {{ category.name }}
            <strong class="ana__legend-value">{{ formatCurrencyShort(category.total) }}</strong>
          </span>
        </template>
      </UiChartPanel>
    </section>

    <section class="ana__bottom">
      <UiChartPanel title="Gastos por cartão" chart-height="auto">
        <CreditCardCategoryHBars v-if="cardHbars.length" :items="cardHbars" :limit="8" />
        <p v-else class="ana__empty">Sem gastos no período.</p>
      </UiChartPanel>

      <UiSurfaceCard as="section" class="ana__table-card" padding="none">
        <div class="ana__table-head">
          <h3 class="ana__table-title">Maiores lançamentos</h3>
        </div>
        <table class="ana__table">
          <thead>
            <tr>
              <th>Lançamento</th>
              <th>Categoria</th>
              <th>Cartão</th>
              <th>Data</th>
              <th class="ana__table-amount">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in analytics.topRows" :key="row.id">
              <td>
                <span class="ana__tx-title">{{ row.title }}</span>
                <span v-if="row.isInstallment && row.installmentCount" class="ana__tx-badge">{{ row.installmentCount }}x</span>
              </td>
              <td>
                <span class="ana__cell-dot" :style="{ background: row.categoryColor }" />{{ row.categoryName }}
              </td>
              <td>{{ row.cardName }}</td>
              <td class="ana__tx-date">{{ formatDayMonth(row.purchaseDate) }}</td>
              <td class="ana__table-amount ana__tx-amount">{{ formatCurrency(row.amount) }}</td>
            </tr>
            <tr v-if="!analytics.topRows.length">
              <td colspan="5" class="ana__empty">Sem lançamentos no período.</td>
            </tr>
          </tbody>
        </table>
      </UiSurfaceCard>
    </section>
  </div>
</template>

<style scoped>
.ana {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.ana__filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.ana__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.ana__chip {
  padding: 6px 14px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-full);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.ana__chip--active {
  background: var(--color-brand-500);
  border-color: var(--color-brand-500);
  color: #fff;
}
.ana__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}
.ana__var {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.ana__var-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.ana__var-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ana__var-icon {
  color: var(--color-text-muted);
}
.ana__var-value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.ana__var-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.ana__var-badge--bad {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}
.ana__var-badge--good {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}
.ana__charts {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-3);
  align-items: start;
}
.ana__bottom {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: var(--space-3);
  align-items: start;
}
.ana__legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.ana__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ana__legend-value {
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}
.ana__table-card {
  overflow: hidden;
}
.ana__table-head {
  padding: var(--space-3) var(--space-3) var(--space-2);
}
.ana__table-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.ana__table {
  width: 100%;
  border-collapse: collapse;
}
.ana__table thead th {
  text-align: left;
  padding: 6px var(--space-3) 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}
.ana__table tbody td {
  padding: 11px var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.ana__table-amount {
  text-align: right;
}
.ana__tx-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.ana__tx-badge {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
}
.ana__cell-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.ana__tx-date {
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}
.ana__tx-amount {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.ana__empty {
  padding: var(--space-3);
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
}
@media (max-width: 980px) {
  .ana__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ana__charts,
  .ana__bottom {
    grid-template-columns: 1fr;
  }
}
</style>
