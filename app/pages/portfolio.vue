<script setup lang="ts">
import type { EChartsOption } from "echarts";
import {
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Download,
  Filter,
  Menu,
  Plus,
  Search,
  Shuffle,
} from "lucide-vue-next";

import { usePortfolioSummaryQuery } from "~/features/wallet/queries/use-portfolio-summary-query";
import { useWalletEntriesQuery } from "~/features/wallet/queries/use-wallet-entries-query";
import { useCreateWalletEntryMutation } from "~/features/wallet/queries/use-create-wallet-entry-mutation";
import { useUpdateWalletEntryMutation } from "~/features/wallet/queries/use-update-wallet-entry-mutation";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { PortfolioSummaryDto, WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";
import {
  MOCK_PORTFOLIO_SUMMARY,
  MOCK_WALLET_ENTRIES,
} from "~/features/portfolio/mock/portfolio.mock";
import { formatCurrency } from "~/utils/currency";

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Carteira",
  pageSubtitle: "Performance e alocação.",
});

useHead({ title: "Carteira | Auraxis" });

interface AllocationRow {
  readonly label: string;
  readonly value: number;
  readonly percentage: number;
  readonly color: string;
}

const { data: summary, isError: isSummaryError } = usePortfolioSummaryQuery();
const { data: entries, isError: isEntriesError } = useWalletEntriesQuery();

const createMutation = useCreateWalletEntryMutation();
const updateMutation = useUpdateWalletEntryMutation();

const isError = computed(() => isSummaryError.value || isEntriesError.value);
const showEntryForm = ref(false);
const editingEntry = ref<WalletEntryDto | null>(null);

const rawEntries = computed(() => entries.value ?? []);
const isUsingSamplePortfolio = computed(() => rawEntries.value.length === 0);
const displayEntries = computed(() => (isUsingSamplePortfolio.value ? MOCK_WALLET_ENTRIES : rawEntries.value));
const shouldShowPortfolioError = computed(
  () => isError.value && rawEntries.value.length === 0 && MOCK_WALLET_ENTRIES.length === 0,
);

const computedSummary = computed<PortfolioSummaryDto>(() => {
  if (summary.value && !isUsingSamplePortfolio.value) {
    return summary.value;
  }

  if (displayEntries.value.length === 0) {
    return MOCK_PORTFOLIO_SUMMARY;
  }

  const totalValue = displayEntries.value.reduce((sum, entry) => sum + entry.current_value, 0);
  const totalCost = displayEntries.value.reduce(
    (sum, entry) => sum + (entry.cost_basis ?? entry.current_value),
    0,
  );
  const totalReturnPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return {
    total_value: totalValue,
    total_cost: totalCost,
    day_change_percent: 0.84,
    total_return_percent: totalReturnPercent,
    asset_count: displayEntries.value.length,
  };
});

/**
 * Handles create mode submission from WalletEntryForm.
 *
 * @param payload Form payload.
 */
const onCreateEntry = (payload: CreateWalletEntryPayload): void => {
  createMutation.mutate(payload, {
    onSuccess: (): void => {
      showEntryForm.value = false;
    },
  });
};

/**
 * Handles edit mode submission from WalletEntryForm.
 *
 * @param id Wallet entry identifier.
 * @param payload Updated fields.
 */
const onEditEntry = (id: string, payload: CreateWalletEntryPayload): void => {
  updateMutation.mutate(
    { id, payload },
    {
      onSuccess: (): void => {
        editingEntry.value = null;
        showEntryForm.value = false;
      },
    },
  );
};

/**
 * Syncs modal visibility and clears edit state on close.
 *
 * @param visible New modal visibility.
 */
const onFormVisibilityChange = (visible: boolean): void => {
  showEntryForm.value = visible;
  if (!visible) {
    editingEntry.value = null;
  }
};

/**
 * Maps backend asset types to the labels used in the prototype.
 *
 * @param assetType Wallet asset type.
 * @returns Human-readable asset class.
 */
function assetTypeLabel(assetType: WalletEntryDto["asset_type"]): string {
  const map: Record<WalletEntryDto["asset_type"], string> = {
    stock: "Ações BR",
    fii: "FIIs",
    crypto: "Cripto",
    fixed_income: "Renda Fixa",
    other: "Exterior",
  };

  return map[assetType];
}

/**
 * Formats percent values with explicit sign.
 *
 * @param value Percentage value.
 * @returns Signed percentage label.
 */
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2).replace(".", ",")}%`;
}

/**
 * Formats nullable quantities for the detailed table.
 *
 * @param value Quantity value.
 * @returns Localized quantity label.
 */
function formatQuantity(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
}

const totalReturnAmount = computed(() => computedSummary.value.total_value - computedSummary.value.total_cost);
const monthlyReturnAmount = computed(() => Math.round(computedSummary.value.total_value * 0.0365));
const yearlyReturnAmount = computed(() => Math.round(Math.max(totalReturnAmount.value, computedSummary.value.total_value * 0.145)));

const allocationRows = computed<AllocationRow[]>(() => {
  const colors = ["#44d4ff", "#42e8a9", "#f59e0b", "#e11d48", "#9da8ff"];
  const totals = new Map<string, number>();

  for (const entry of displayEntries.value) {
    const label = assetTypeLabel(entry.asset_type);
    totals.set(label, (totals.get(label) ?? 0) + entry.current_value);
  }

  const total = computedSummary.value.total_value || 1;
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      percentage: Math.round((value / total) * 100),
      color: colors[index] ?? "#8da2bf",
    }));
});

const performanceChartOption = computed<EChartsOption>(() => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const base = Math.max(computedSummary.value.total_cost, 1000);
  const portfolio = months.map((_, index) => Math.round(base * (1 + index * 0.031 + Math.sin(index) * 0.012)));
  const benchmark = months.map((_, index) => Math.round(base * (1 + index * 0.014)));

  return {
    backgroundColor: "transparent",
    color: ["#44d4ff", "#42e8a9"],
    grid: { top: 24, right: 20, bottom: 32, left: 62 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(11, 18, 32, 0.95)",
      borderColor: "rgba(68, 212, 255, 0.24)",
      textStyle: { color: "#f8fbff" },
      valueFormatter: (value): string => formatCurrency(Number(value)),
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: "#8da2bf" },
    },
    media: [
      {
        query: { maxWidth: 520 },
        option: {
          grid: { top: 56, right: 10, bottom: 28, left: 44 },
          legend: {
            top: 0,
            left: 0,
            right: "auto",
            itemGap: 8,
            itemHeight: 6,
            itemWidth: 10,
            textStyle: { color: "#8da2bf", fontSize: 10 },
          },
        },
      },
    ],
    xAxis: {
      type: "category",
      data: months,
      axisLine: { lineStyle: { color: "rgba(141, 162, 191, 0.25)" } },
      axisTick: { show: false },
      axisLabel: { color: "#8da2bf" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(141, 162, 191, 0.12)" } },
      axisLabel: {
        color: "#8da2bf",
        formatter: (value: number): string => `${Math.round(value / 1000)}k`,
      },
    },
    series: [
      {
        name: "Carteira",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3 },
        areaStyle: { color: "rgba(68, 212, 255, 0.1)" },
        data: portfolio,
      },
      {
        name: "Benchmark",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2 },
        data: benchmark,
      },
    ],
  };
});

const allocationChartOption = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  color: allocationRows.value.map((row) => row.color),
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(11, 18, 32, 0.95)",
    borderColor: "rgba(68, 212, 255, 0.24)",
    textStyle: { color: "#f8fbff" },
    formatter: "{b}: {d}%",
  },
  series: [
    {
      name: "Alocação",
      type: "pie",
      radius: ["58%", "78%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: "#111827",
        borderWidth: 4,
      },
      data: allocationRows.value.map((row) => ({
        name: row.label,
        value: row.value,
      })),
    },
  ],
}));
</script>

<template>
  <div class="portfolio-market-pulse">
    <section class="portfolio-header" aria-label="Cabeçalho da carteira">
      <div class="portfolio-header__title">
        <button class="portfolio-menu" type="button" aria-label="Abrir menu">
          <Menu :size="20" aria-hidden="true" />
        </button>
        <div>
          <h1>Visão Geral da Carteira</h1>
          <p>Acompanhamento técnico da carteira, alocação e posições.</p>
          <span v-if="isUsingSamplePortfolio" class="sample-pill">
            Carteira demonstrativa para validar o layout Market Pulse
          </span>
        </div>
      </div>

      <div class="portfolio-header__actions">
        <label class="search-field" for="asset-search">
          <Search :size="15" aria-hidden="true" />
          <input id="asset-search" type="search" placeholder="Buscar ativo...">
        </label>
        <button class="icon-button" type="button" aria-label="Notificações">
          <Bell :size="20" aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <button class="mp-button mp-button--ghost" type="button">
          <Download :size="16" aria-hidden="true" />
          Exportar
        </button>
      </div>
    </section>

    <WalletEntryForm
      :visible="showEntryForm"
      :initial-entry="editingEntry"
      @update:visible="onFormVisibilityChange"
      @submit="onCreateEntry"
      @edit="onEditEntry"
    />

    <UiInlineError
      v-if="shouldShowPortfolioError"
      :title="$t('pages.portfolio.loadError')"
      :message="$t('pages.portfolio.loadErrorMessage')"
    />

    <template v-else>
      <section id="summary-kpis" class="summary-kpis">
        <article class="portfolio-kpi portfolio-kpi--hero">
          <div class="kpi-glow" aria-hidden="true" />
          <div class="kpi-heading">
            <div>
              <p>Patrimônio Total</p>
              <strong>{{ formatCurrency(computedSummary.total_value) }}</strong>
            </div>
            <span class="trend-pill trend-pill--positive">
              <ArrowUp :size="13" aria-hidden="true" />
              {{ formatPercent(computedSummary.total_return_percent) }}
            </span>
          </div>
          <div class="kpi-actions">
            <button class="mp-button mp-button--primary" type="button" @click="showEntryForm = true">
              <Plus :size="16" aria-hidden="true" />
              Aportar
            </button>
            <button class="mp-button mp-button--secondary" type="button">
              <Shuffle :size="16" aria-hidden="true" />
              Resgatar
            </button>
          </div>
        </article>

        <article class="portfolio-kpi">
          <div class="kpi-heading">
            <div>
              <p>Rentabilidade (Mês)</p>
              <strong class="is-positive">+ {{ formatCurrency(monthlyReturnAmount) }}</strong>
            </div>
            <select aria-label="Mês da rentabilidade">
              <option>Maio</option>
              <option>Abril</option>
            </select>
          </div>
          <div class="comparison-line">
            <span class="trend-pill trend-pill--positive">
              <ArrowUp :size="13" aria-hidden="true" />
              3,20%
            </span>
            <span>vs. Ibovespa (1,50%)</span>
          </div>
        </article>

        <article class="portfolio-kpi">
          <div class="kpi-heading">
            <div>
              <p>Rentabilidade (Ano)</p>
              <strong class="is-positive">+ {{ formatCurrency(yearlyReturnAmount) }}</strong>
            </div>
            <span class="kpi-year">2026</span>
          </div>
          <div class="comparison-line">
            <span class="trend-pill trend-pill--positive">
              <ArrowUp :size="13" aria-hidden="true" />
              14,50%
            </span>
            <span>vs. CDI (6,20%)</span>
          </div>
        </article>
      </section>

      <section class="portfolio-analytics-grid">
        <article id="portfolio-performance" class="mp-panel portfolio-performance">
          <div class="panel-heading">
            <div>
              <h2>Evolução Patrimonial</h2>
              <p>Acompanhamento histórico da carteira vs. benchmark</p>
            </div>
            <div class="range-tabs" aria-label="Intervalo de performance">
              <button type="button">1M</button>
              <button type="button">6M</button>
              <button type="button" class="is-active">1A</button>
              <button type="button">TUDO</button>
            </div>
          </div>
          <UiChart :option="performanceChartOption" height="320px" />
        </article>

        <article id="portfolio-allocation" class="mp-panel portfolio-allocation">
          <div class="panel-heading panel-heading--stacked">
            <h2>Alocação por Classe</h2>
            <p>Distribuição atual do portfólio</p>
          </div>
          <div class="allocation-chart">
            <UiChart :option="allocationChartOption" height="230px" />
            <div class="allocation-total" aria-hidden="true">
              <span>Total</span>
              <strong>100%</strong>
            </div>
          </div>
          <div class="allocation-list">
            <div v-for="row in allocationRows" :key="row.label" class="allocation-row">
              <span>
                <i :style="{ background: row.color }" aria-hidden="true" />
                {{ row.label }}
              </span>
              <strong>{{ row.percentage }}%</strong>
            </div>
          </div>
        </article>
      </section>

      <section id="portfolio-positions" class="portfolio-positions">
        <div class="positions-header">
          <div>
            <h2>Posição Detalhada de Ativos</h2>
            <p>Visão técnica avançada (TradeMap View)</p>
          </div>
          <label class="position-filter" for="portfolio-position-filter">
            <Filter :size="13" aria-hidden="true" />
            <select id="portfolio-position-filter">
              <option>Todos os Ativos</option>
              <option>Ações</option>
              <option>FIIs</option>
              <option>Renda Fixa</option>
            </select>
          </label>
        </div>

        <div class="positions-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ativo / Ticker</th>
                <th class="is-numeric">Qtd.</th>
                <th class="is-numeric">Preço Médio</th>
                <th class="is-numeric">Cotação Atual</th>
                <th class="is-numeric">Total (R$)</th>
                <th class="is-numeric">Aloc. (%)</th>
                <th class="is-numeric">Var. Dia</th>
                <th class="is-numeric">Var. Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in displayEntries" :key="entry.id">
                <td>
                  <div class="asset-cell">
                    <span>{{ (entry.ticker ?? entry.name).slice(0, 4).toUpperCase() }}</span>
                    <div>
                      <strong>{{ entry.ticker ?? entry.name }}</strong>
                      <small>{{ entry.name }}</small>
                    </div>
                  </div>
                </td>
                <td class="is-numeric">{{ formatQuantity(entry.quantity) }}</td>
                <td class="is-numeric is-muted">
                  {{ formatCurrency(entry.cost_basis && entry.quantity ? entry.cost_basis / entry.quantity : entry.cost_basis ?? entry.current_value) }}
                </td>
                <td class="is-numeric">
                  {{ formatCurrency(entry.quantity ? entry.current_value / entry.quantity : entry.current_value) }}
                </td>
                <td class="is-numeric">{{ formatCurrency(entry.current_value) }}</td>
                <td class="is-numeric">
                  <span class="allocation-mini">
                    {{ Math.round((entry.current_value / Math.max(computedSummary.total_value, 1)) * 100) }}%
                    <i aria-hidden="true">
                      <b :style="{ width: `${Math.round((entry.current_value / Math.max(computedSummary.total_value, 1)) * 100)}%` }" />
                    </i>
                  </span>
                </td>
                <td
                  class="is-numeric"
                  :class="(entry.change_percent ?? 0) >= 0 ? 'is-positive' : 'is-negative'"
                >
                  <ArrowUpRight v-if="(entry.change_percent ?? 0) >= 0" :size="13" aria-hidden="true" />
                  <ArrowDownRight v-else :size="13" aria-hidden="true" />
                  {{ formatPercent(entry.change_percent) }}
                </td>
                <td
                  class="is-numeric"
                  :class="entry.current_value >= (entry.cost_basis ?? entry.current_value) ? 'is-positive' : 'is-negative'"
                >
                  {{ formatPercent(((entry.current_value - (entry.cost_basis ?? entry.current_value)) / Math.max(entry.cost_basis ?? entry.current_value, 1)) * 100) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.portfolio-market-pulse {
  --mp-surface: #111827;
  --mp-card: #151f31;
  --mp-border: rgba(130, 157, 198, 0.22);
  --mp-border-strong: rgba(130, 157, 198, 0.34);
  --mp-text: #f7fbff;
  --mp-muted: #8da2bf;
  --mp-cyan: #44d4ff;
  --mp-lime: #42e8a9;
  --mp-red: #ff6f79;
  display: grid;
  gap: 32px;
  color: var(--mp-text);
}

.portfolio-header,
.portfolio-header__title,
.portfolio-header__actions,
.summary-kpis,
.portfolio-analytics-grid,
.kpi-heading,
.kpi-actions,
.comparison-line,
.panel-heading,
.positions-header {
  display: flex;
  gap: 18px;
}

.portfolio-header {
  align-items: center;
  justify-content: space-between;
}

.portfolio-header__title {
  align-items: flex-start;
}

.portfolio-header h1,
.panel-heading h2,
.positions-header h2 {
  margin: 0;
  color: var(--mp-text);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

.portfolio-header p,
.panel-heading p,
.positions-header p {
  margin: 6px 0 0;
  color: var(--mp-muted);
  font-size: var(--font-size-sm);
}

.portfolio-menu {
  display: none;
}

.sample-pill {
  display: inline-flex;
  margin-top: 12px;
  border: 1px solid rgba(68, 212, 255, 0.26);
  border-radius: var(--radius-full);
  padding: 6px 10px;
  color: var(--mp-cyan);
  background: rgba(68, 212, 255, 0.08);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.portfolio-header__actions {
  align-items: center;
}

.search-field {
  display: inline-flex;
  min-height: 40px;
  width: 260px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-full);
  padding: 0 14px;
  background: var(--mp-card);
  color: var(--mp-muted);
}

.search-field input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--mp-text);
  font: inherit;
  font-size: var(--font-size-sm);
}

.search-field input::placeholder {
  color: var(--mp-muted);
}

.mp-button,
.icon-button,
.range-tabs button,
.table-action {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  min-height: 38px;
  padding: 0 13px;
  background: var(--mp-card);
  color: var(--mp-text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.mp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mp-button--primary {
  border-color: rgba(68, 212, 255, 0.36);
  background: var(--mp-cyan);
  color: #07101b;
  box-shadow: 0 0 20px rgba(68, 212, 255, 0.22);
}

.mp-button--ghost {
  border-color: rgba(68, 212, 255, 0.25);
  color: var(--mp-cyan);
  background: rgba(68, 212, 255, 0.08);
}

.icon-button {
  position: relative;
  width: 40px;
  padding: 0;
  color: var(--mp-muted);
}

.icon-button span {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border: 1px solid var(--mp-surface);
  border-radius: 50%;
  background: var(--mp-lime);
}

.summary-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.portfolio-kpi,
.mp-panel,
.portfolio-positions {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-lg);
  background: var(--mp-card);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.portfolio-kpi {
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.portfolio-kpi--hero {
  background:
    radial-gradient(circle at 100% 0%, rgba(68, 212, 255, 0.1), transparent 36%),
    var(--mp-card);
}

.kpi-heading {
  align-items: flex-start;
  justify-content: space-between;
}

.kpi-heading p {
  margin: 0 0 8px;
  color: var(--mp-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.kpi-heading strong {
  display: block;
  color: var(--mp-text);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-3xl);
  line-height: 1.12;
}

.portfolio-kpi--hero .kpi-heading strong {
  font-size: var(--font-size-3xl);
}

.kpi-heading select {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  background: transparent;
  color: var(--mp-muted);
  font: inherit;
  font-size: var(--font-size-xs);
}

.kpi-year {
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
}

.kpi-actions {
  margin-top: 28px;
}

.kpi-actions .mp-button {
  flex: 1;
}

.trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--radius-xs);
  padding: 5px 8px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
}

.trend-pill--positive {
  color: var(--mp-lime);
  background: rgba(66, 232, 169, 0.1);
}

.comparison-line {
  align-items: center;
  margin-top: 16px;
  color: var(--mp-muted);
  font-size: var(--font-size-sm);
}

.is-positive {
  color: var(--mp-lime) !important;
}

.is-negative {
  color: var(--mp-red) !important;
}

.is-muted {
  color: var(--mp-muted) !important;
}

.portfolio-analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
}

.mp-panel {
  padding: 24px;
}

.panel-heading {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-heading--stacked {
  display: block;
}

.range-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-tabs button {
  min-height: 30px;
  border-color: var(--mp-border);
  padding: 0 10px;
  color: var(--mp-muted);
  background: transparent;
}

.range-tabs button.is-active {
  border-color: rgba(68, 212, 255, 0.36);
  background: rgba(68, 212, 255, 0.1);
  color: var(--mp-cyan);
}

.allocation-chart {
  position: relative;
  display: grid;
  min-height: 230px;
  place-items: center;
}

.allocation-total {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  pointer-events: none;
}

.allocation-total span {
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
}

.allocation-total strong {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-lg);
}

.allocation-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.allocation-row,
.allocation-row span {
  display: flex;
  align-items: center;
}

.allocation-row {
  justify-content: space-between;
  color: var(--mp-muted);
  font-size: var(--font-size-sm);
}

.allocation-row span {
  gap: 9px;
}

.allocation-row i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.allocation-row strong {
  color: var(--mp-text);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

.portfolio-positions {
  overflow: hidden;
}

.positions-header {
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--mp-border);
  padding: 24px;
  background: rgba(17, 24, 39, 0.42);
}

.position-filter {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  padding: 0 10px;
  background: #0e1625;
  color: var(--mp-muted);
}

.position-filter select {
  border: 0;
  background: transparent;
  color: var(--mp-text);
  font: inherit;
  font-size: var(--font-size-xs);
}

.positions-table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th,
td {
  border-bottom: 1px solid var(--mp-border);
  padding: 16px;
  vertical-align: middle;
}

th {
  color: var(--mp-muted);
  background: rgba(10, 16, 29, 0.45);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

td {
  color: var(--mp-text);
  font-size: var(--font-size-sm);
}

tbody tr:hover {
  background: rgba(130, 157, 198, 0.07);
}

.is-numeric {
  text-align: right;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  white-space: nowrap;
}

td.is-numeric.is-positive,
td.is-numeric.is-negative {
  display: table-cell;
}

.asset-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 210px;
}

.asset-cell > span {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.08);
  color: var(--mp-text);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
}

.asset-cell strong {
  display: block;
  color: var(--mp-cyan);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--font-size-sm);
}

.asset-cell small {
  display: block;
  margin-top: 2px;
  color: var(--mp-muted);
  font-size: var(--font-size-xs);
}

.allocation-mini {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.allocation-mini i {
  display: block;
  overflow: hidden;
  width: 48px;
  height: 6px;
  border-radius: var(--radius-full);
  background: #0e1625;
}

.allocation-mini b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--mp-cyan);
}

@media (max-width: 1120px) {
  .summary-kpis,
  .portfolio-analytics-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    width: 220px;
  }
}

@media (max-width: 760px) {
  .portfolio-market-pulse {
    gap: 22px;
  }

  .portfolio-header,
  .portfolio-header__actions,
  .panel-heading,
  .positions-header {
    align-items: stretch;
    flex-direction: column;
  }

  .portfolio-menu {
    display: inline-flex;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--mp-border);
    border-radius: var(--radius-sm);
    background: var(--mp-card);
    color: var(--mp-muted);
  }

  .portfolio-header__actions,
  .kpi-actions {
    flex-wrap: wrap;
  }

  .search-field {
    width: 100%;
  }

  .portfolio-kpi,
  .mp-panel,
  .positions-header {
    padding: 18px;
  }

  .kpi-heading {
    gap: 12px;
  }

  .portfolio-kpi--hero .kpi-heading strong,
  .kpi-heading strong {
    font-size: var(--font-size-2xl);
  }
}
</style>
