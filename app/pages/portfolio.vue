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
import NetWorthTimeline from "~/components/portfolio/NetWorthTimeline/NetWorthTimeline.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { formatCurrency } from "~/utils/currency";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens, withAlpha } from "~/utils/chart-theme";

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

const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = usePortfolioSummaryQuery();
const { data: entries, isLoading: isEntriesLoading, isError: isEntriesError } = useWalletEntriesQuery();
const { data: goals } = useGoalsQuery();
const { resolvedTheme } = useTheme();

const createMutation = useCreateWalletEntryMutation();
const updateMutation = useUpdateWalletEntryMutation();

const isError = computed(() => isSummaryError.value || isEntriesError.value);
const showEntryForm = ref(false);
const editingEntry = ref<WalletEntryDto | null>(null);
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

const rawEntries = computed(() => entries.value ?? []);
const displayEntries = computed(() => rawEntries.value);
const isLoading = computed(() => isSummaryLoading.value || isEntriesLoading.value);
const isPortfolioEmpty = computed(() => !isLoading.value && rawEntries.value.length === 0);
const shouldShowPortfolioError = computed(
  () => isError.value && rawEntries.value.length === 0,
);

const computedSummary = computed<PortfolioSummaryDto>(() => {
  if (summary.value) {
    return summary.value;
  }

  if (displayEntries.value.length === 0) {
    return {
      total_value: 0,
      total_cost: 0,
      day_change_percent: null,
      total_return_percent: 0,
      asset_count: 0,
    };
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
 * Converts calculations to finite numbers before they reach charts/templates.
 *
 * @param value Raw numeric value.
 * @param fallback Value used when input is not finite.
 * @returns Finite number.
 */
function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Clamps percentages used in compact progress bars.
 *
 * @param value Raw percentage.
 * @returns Percentage between 0 and 100.
 */
function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(safeNumber(value))));
}

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
  if (value === null || value === undefined || !Number.isFinite(value)) {
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
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
}

/**
 * Calculates the average acquisition cost without exposing invalid divisions.
 *
 * @param entry Wallet entry shown in the positions table.
 * @returns Average cost per unit, or cost basis for non-quantity assets.
 */
function averageCost(entry: WalletEntryDto): number {
  const quantity = safeNumber(entry.quantity, 0);
  const costBasis = safeNumber(entry.cost_basis, safeNumber(entry.current_value));
  return quantity > 0 ? costBasis / quantity : costBasis;
}

/**
 * Calculates the current quote per unit without exposing invalid divisions.
 *
 * @param entry Wallet entry shown in the positions table.
 * @returns Current quote per unit, or current value for non-quantity assets.
 */
function currentQuote(entry: WalletEntryDto): number {
  const quantity = safeNumber(entry.quantity, 0);
  const currentValue = safeNumber(entry.current_value);
  return quantity > 0 ? currentValue / quantity : currentValue;
}

/**
 * Calculates the allocation percentage for a wallet entry.
 *
 * @param entry Wallet entry shown in the positions table.
 * @returns Allocation percentage clamped to chart-safe bounds, or null.
 */
function entryAllocationPercent(entry: WalletEntryDto): number | null {
  const total = safeNumber(computedSummary.value.total_value);
  if (total <= 0) {
    return null;
  }

  return clampPercent((safeNumber(entry.current_value) / total) * 100);
}

/**
 * Calculates total return for a wallet entry.
 *
 * @param entry Wallet entry shown in the positions table.
 * @returns Return percentage, or null when there is no valid cost basis.
 */
function totalReturnPercent(entry: WalletEntryDto): number | null {
  const currentValue = safeNumber(entry.current_value);
  const costBasis = safeNumber(entry.cost_basis, currentValue);
  if (costBasis <= 0) {
    return null;
  }

  return ((currentValue - costBasis) / costBasis) * 100;
}

const totalReturnAmount = computed(() => safeNumber(computedSummary.value.total_value) - safeNumber(computedSummary.value.total_cost));
const monthlyReturnAmount = computed(() => Math.round(safeNumber(computedSummary.value.total_value) * 0.0365));
const yearlyReturnAmount = computed(() => Math.round(Math.max(totalReturnAmount.value, safeNumber(computedSummary.value.total_value) * 0.145)));
const displayGoals = computed(() => {
  if (goals.value?.length) {
    return goals.value;
  }

  return [];
});
const projectedMonthlyContribution = computed(() => Math.max(500, Math.round(safeNumber(computedSummary.value.total_value) * 0.012)));

const allocationRows = computed<AllocationRow[]>(() => {
  const tokens = chartTokens.value;
  const colors = [
    tokens.balance,
    tokens.income,
    tokens.investment,
    tokens.expense,
    tokens.series[4],
  ];
  const totals = new Map<string, number>();

  for (const entry of displayEntries.value) {
    const label = assetTypeLabel(entry.asset_type);
    const currentValue = safeNumber(entry.current_value);
    if (currentValue > 0) {
      totals.set(label, (totals.get(label) ?? 0) + currentValue);
    }
  }

  const total = safeNumber(computedSummary.value.total_value);
  if (total <= 0) {
    return [];
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      percentage: Math.round((value / total) * 100),
      color: colors[index] ?? tokens.mutedText,
    }));
});

const performanceChartOption = computed<EChartsOption>(() => {
  const tokens = chartTokens.value;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const base = Math.max(computedSummary.value.total_cost, 1000);
  const portfolio = months.map((_, index) => Math.round(base * (1 + index * 0.031 + Math.sin(index) * 0.012)));
  const benchmark = months.map((_, index) => Math.round(base * (1 + index * 0.014)));

  return {
    backgroundColor: "transparent",
    color: [tokens.balance, tokens.income],
    grid: { top: 24, right: 20, bottom: 32, left: 62 },
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.tooltipBackground,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
      valueFormatter: (value): string => formatCurrency(Number(value)),
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.mutedText },
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
            textStyle: { color: tokens.mutedText, fontSize: 10 },
          },
        },
      },
    ],
    xAxis: {
      type: "category",
      data: months,
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
      axisLabel: { color: tokens.mutedText },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: tokens.grid } },
      axisLabel: {
        color: tokens.mutedText,
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
        areaStyle: { color: withAlpha(tokens.balance, resolvedTheme.value === "dark" ? 0.1 : 0.16) },
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

const allocationChartOption = computed<EChartsOption>(() => {
  const tokens = chartTokens.value;

  return {
    backgroundColor: "transparent",
    color: allocationRows.value.map((row) => row.color),
    tooltip: {
      trigger: "item",
      backgroundColor: tokens.tooltipBackground,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
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
          borderColor: tokens.pieBorder,
          borderWidth: 4,
        },
        data: allocationRows.value.map((row) => ({
          name: row.label,
          value: row.value,
        })),
      },
    ],
  };
});
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

    <UiPageLoader v-else-if="isLoading" :rows="4" :with-title="true" />

    <section v-else-if="isPortfolioEmpty" class="portfolio-empty-state" aria-label="Carteira vazia">
      <UiEmptyState
        icon="wallet"
        title="Comece adicionando seu primeiro ativo"
        description="Sua carteira mostra patrimônio, rentabilidade, alocação e evolução somente depois que você cadastrar ativos reais. Você pode começar por uma ação, fundo, renda fixa, cripto ou outro investimento que faça parte do seu planejamento."
        action-label="Adicionar ativo"
        secondary-label="Ver ferramentas de investimento"
        secondary-href="/tools"
        @action="showEntryForm = true"
      >
        <template #illustration>
          <svg class="ui-empty-state__illustration-svg" viewBox="0 0 220 150" role="img" aria-label="Ilustração de uma carteira vazia">
            <rect x="28" y="34" width="164" height="94" rx="18" fill="var(--color-bg-elevated)" stroke="var(--color-outline-soft)" stroke-width="3" />
            <path d="M48 62h98c16 0 28 12 28 28v16H76c-15 0-28-12-28-28V62Z" fill="var(--color-brand-hover-surface)" />
            <circle cx="168" cy="83" r="9" fill="var(--color-brand-500)" />
            <path d="M72 42c7-14 20-22 38-22 19 0 34 9 43 26" fill="none" stroke="var(--color-positive)" stroke-width="6" stroke-linecap="round" />
            <path d="M74 102h50" stroke="var(--color-outline-hard)" stroke-width="5" stroke-linecap="round" />
            <path d="M74 82h34" stroke="var(--color-brand-500)" stroke-width="5" stroke-linecap="round" />
          </svg>
        </template>
      </UiEmptyState>
    </section>

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

      <AiInsightSurface class="portfolio-ai-insights" dimension="wallet" />

      <NetWorthTimeline
        aria-label="Projeção Patrimonial"
        :current-net-worth="computedSummary.total_value"
        :invested-amount="computedSummary.total_cost"
        :monthly-contribution="projectedMonthlyContribution"
        :goals="displayGoals"
      />

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
          <div v-if="allocationRows.length > 0" class="allocation-chart">
            <UiChart :option="allocationChartOption" height="230px" />
            <div class="allocation-total" aria-hidden="true">
              <span>Total</span>
              <strong>100%</strong>
            </div>
          </div>
          <div v-if="allocationRows.length > 0" class="allocation-list">
            <div v-for="row in allocationRows" :key="row.label" class="allocation-row">
              <span>
                <i :style="{ background: row.color }" aria-hidden="true" />
                {{ row.label }}
              </span>
              <strong>{{ row.percentage }}%</strong>
            </div>
          </div>
          <div v-else class="allocation-empty">
            <strong>Sem alocação calculável</strong>
            <span>Cadastre valores positivos nos ativos para visualizar a distribuição da carteira.</span>
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
                  {{ formatCurrency(averageCost(entry)) }}
                </td>
                <td class="is-numeric">
                  {{ formatCurrency(currentQuote(entry)) }}
                </td>
                <td class="is-numeric">{{ formatCurrency(entry.current_value) }}</td>
                <td class="is-numeric">
                  <span class="allocation-mini">
                    {{ entryAllocationPercent(entry) === null ? "-" : `${entryAllocationPercent(entry)}%` }}
                    <i aria-hidden="true">
                      <b :style="{ width: `${entryAllocationPercent(entry) ?? 0}%` }" />
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
                  :class="(totalReturnPercent(entry) ?? 0) >= 0 ? 'is-positive' : 'is-negative'"
                >
                  {{ formatPercent(totalReturnPercent(entry)) }}
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
  --mp-surface: var(--color-bg-surface);
  --mp-card: var(--color-bg-surface);
  --mp-card-strong: var(--color-bg-elevated);
  --mp-border: var(--color-outline-soft);
  --mp-border-strong: var(--color-outline-hard);
  --mp-text: var(--color-text-primary);
  --mp-muted: var(--color-text-muted);
  --mp-cyan: var(--color-brand-500);
  --mp-lime: var(--color-positive);
  --mp-red: var(--color-negative);
  --mp-brand-soft: var(--color-brand-hover-surface);
  --mp-neutral-soft: var(--color-bg-subtle);
  --mp-track: color-mix(in srgb, var(--color-text-muted) 16%, transparent);
  --mp-panel-shadow: var(--shadow-card);
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

.portfolio-header__actions {
  align-items: center;
}

.portfolio-empty-state {
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0%, var(--color-brand-glow-2xs), transparent 34%),
    var(--mp-card);
  box-shadow: var(--mp-panel-shadow);
}

.portfolio-ai-insights {
  padding: var(--space-4);
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-lg);
  background: var(--mp-card);
  box-shadow: var(--mp-panel-shadow);
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
  border-color: var(--color-brand-glow-md);
  background: var(--mp-cyan);
  color: var(--color-text-on-brand);
  box-shadow: var(--shadow-brand-glow-sm);
}

.mp-button--ghost {
  border-color: var(--color-brand-glow-sm);
  color: var(--mp-cyan);
  background: var(--mp-brand-soft);
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
  box-shadow: var(--mp-panel-shadow);
}

.portfolio-kpi {
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.portfolio-kpi--hero {
  background:
    radial-gradient(circle at 100% 0%, var(--color-brand-glow-xs), transparent 36%),
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
  background: var(--color-positive-bg);
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
  border-color: var(--color-brand-glow-md);
  background: var(--mp-brand-soft);
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

.allocation-empty {
  display: grid;
  min-height: 230px;
  align-content: center;
  justify-items: center;
  gap: 8px;
  padding: var(--space-4);
  border: 1px dashed var(--mp-border);
  border-radius: var(--radius-md);
  color: var(--mp-muted);
  text-align: center;
}

.allocation-empty strong {
  color: var(--mp-text);
  font-size: var(--font-size-md);
}

.allocation-empty span {
  max-width: 34ch;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
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
  background: var(--mp-card-strong);
}

.position-filter {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--mp-border);
  border-radius: var(--radius-xs);
  padding: 0 10px;
  background: var(--mp-card-strong);
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
  background: var(--mp-card-strong);
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
  background: var(--mp-neutral-soft);
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
  background: var(--mp-neutral-soft);
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
  background: var(--mp-track);
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
