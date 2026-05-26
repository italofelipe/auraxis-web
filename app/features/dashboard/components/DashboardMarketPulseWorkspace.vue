<script setup lang="ts">
import type { Component } from "vue";
import type { EChartsOption } from "echarts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeAlert,
  CalendarClock,
  ChevronLeft,
  CircleDollarSign,
  Download,
  Filter,
  LineChart,
  PieChart,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-vue-next";
import { NButton, NInput } from "naive-ui";

import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { formatCurrency } from "~/utils/currency";
import { useTheme } from "~/composables/useTheme";
import { buildChartThemeTokens, type ChartThemeTokens, withAlpha } from "~/utils/chart-theme";
import type {
  DashboardAlert,
  DashboardComparison,
  DashboardExpenseCategory,
  DashboardSummary,
  DashboardTimeseriesPoint,
  DashboardTrendsMonthEntry,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

interface Props {
  /** Summary totals for the selected period. */
  readonly summary: DashboardSummary | null;
  /** Period-over-period comparison percentages. */
  readonly comparison: DashboardComparison | null;
  /** Daily cashflow points returned by the overview endpoint. */
  readonly timeseries: DashboardTimeseriesPoint[];
  /** Ranked expense categories for the selected period. */
  readonly expensesByCategory: DashboardExpenseCategory[];
  /** Upcoming due transactions used by the operational table. */
  readonly upcomingDues: DashboardUpcomingDue[];
  /** Backend alerts displayed as anomaly cards. */
  readonly alerts: DashboardAlert[];
  /** Monthly trend series used when daily timeseries is empty. */
  readonly trends: DashboardTrendsMonthEntry[];
  /** Whether the workspace should show its loading skeleton. */
  readonly loading?: boolean;
  /** Reading mode selected in the dashboard command bar. */
  readonly mode?: "analytical" | "essential";
}

type KpiTone = "income" | "expense" | "balance" | "savings";
type AnomalyTone = "warning" | "danger" | "info";

interface KpiCard {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly trend: string;
  readonly trendTone: "positive" | "negative" | "neutral";
  readonly helper: string;
  readonly icon: Component;
  readonly tone: KpiTone;
}

interface CashflowPoint {
  readonly label: string;
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
}

interface CategoryRow {
  readonly category: string;
  readonly amount: number;
  readonly percentage: number;
}

interface TransactionRow {
  readonly id: string;
  readonly description: string;
  readonly category: string;
  readonly dueDate: string;
  readonly status: string;
  readonly amount: number;
}

interface AnomalyCard {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly tone: AnomalyTone;
  readonly timestamp: string;
}

interface ExecutiveSignal {
  readonly key: string;
  readonly icon: Component;
  readonly text: string;
}

const EMPTY_SUMMARY: DashboardSummary = {
  income: 0,
  expense: 0,
  balance: 0,
  upcomingDueTotal: 0,
  netWorth: 0,
};

const EMPTY_COMPARISON: DashboardComparison = {
  incomeVsPreviousMonthPercent: null,
  expenseVsPreviousMonthPercent: null,
  balanceVsPreviousMonthPercent: null,
};

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  mode: "analytical",
});

const { resolvedTheme } = useTheme();
const chartTokens = computed(() => buildChartThemeTokens(resolvedTheme.value));

/**
 * Formats a percentage delta with an explicit sign.
 *
 * @param value Percentage value returned by the API.
 * @returns Signed percentage label.
 */
function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "sem comparativo";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Resolves trend tone from a raw percentage value.
 *
 * @param value Percentage value returned by the API.
 * @param inverted Whether positive movement is undesirable.
 * @returns Visual trend tone.
 */
function resolveTrendTone(
  value: number | null | undefined,
  inverted = false,
): KpiCard["trendTone"] {
  if (value === null || value === undefined || value === 0) {
    return "neutral";
  }

  const normalized = inverted ? -value : value;
  return normalized > 0 ? "positive" : "negative";
}

/**
 * Formats an ISO date as a compact PT-BR day/month label.
 *
 * @param value ISO date string.
 * @returns Compact date label.
 */
function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

/**
 * Formats a YYYY-MM string as a compact PT-BR month label.
 *
 * @param value Month string in YYYY-MM format.
 * @returns Compact month label.
 */
function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(`${value}-01T00:00:00`));
}

/**
 * Calculates the savings rate from income and net balance.
 *
 * @param summary Dashboard summary.
 * @returns Savings rate in percentage points.
 */
function calculateSavingsRate(summary: DashboardSummary | null): number {
  if (!summary || summary.income <= 0) {
    return 0;
  }

  return (summary.balance / summary.income) * 100;
}

/**
 * Builds the chart source, falling back from daily points to trend months and
 * finally to the current summary so the chart never becomes a giant blank area.
 *
 * @param summary Current dashboard summary.
 * @param timeseries Daily cashflow points.
 * @param trends Monthly trend series.
 * @returns Normalized cashflow points.
 */
function buildCashflowPoints(
  summary: DashboardSummary | null,
  timeseries: DashboardTimeseriesPoint[],
  trends: DashboardTrendsMonthEntry[],
): CashflowPoint[] {
  if (timeseries.length > 0) {
    return timeseries.map((point) => ({
      label: formatShortDate(point.date),
      income: point.income,
      expense: point.expense,
      balance: point.balance,
    }));
  }

  if (trends.length > 0) {
    return trends.map((point) => ({
      label: formatMonth(point.month),
      income: point.income,
      expense: point.expenses,
      balance: point.balance,
    }));
  }

  if (summary) {
    return [
      {
        label: "Período",
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance,
      },
    ];
  }

  return [];
}

/**
 * Converts category data into a stable ranking and adds a summary fallback.
 *
 * @param summary Current dashboard summary.
 * @param categories Expense categories from the API.
 * @returns Ranked category rows.
 */
function buildCategoryRows(
  summary: DashboardSummary | null,
  categories: DashboardExpenseCategory[],
): CategoryRow[] {
  if (categories.length > 0) {
    return [...categories].sort((a, b) => b.amount - a.amount);
  }

  if (summary && summary.expense > 0) {
    return [
      {
        category: "Despesas do período",
        amount: summary.expense,
        percentage: 100,
      },
    ];
  }

  return [];
}

/**
 * Maps upcoming dues into operational transaction rows.
 *
 * @param dues Upcoming due transactions.
 * @returns Transaction rows shown in the dashboard table.
 */
function buildTransactionRows(dues: DashboardUpcomingDue[]): TransactionRow[] {
  return dues.slice(0, 5).map((due) => ({
    id: due.id,
    description: due.description,
    category: due.category ?? "Sem categoria",
    dueDate: formatShortDate(due.dueDate),
    status: "A vencer",
    amount: due.amount,
  }));
}

/**
 * Builds anomaly cards from API alerts or deterministic dashboard signals.
 *
 * @param summary Current dashboard summary.
 * @param alerts Backend alerts.
 * @returns Anomaly card models.
 */
function buildAnomalies(
  summary: DashboardSummary | null,
  alerts: DashboardAlert[],
): AnomalyCard[] {
  if (alerts.length > 0) {
    return alerts.slice(0, 3).map((alert, index) => ({
      key: `${alert.type}-${index}`,
      title: alert.title,
      description: alert.description ?? "Sinal financeiro relevante para revisar no período.",
      actionLabel: alert.actionLabel ?? "Analisar",
      tone: alert.type === "error" ? "danger" : "warning",
      timestamp: index === 0 ? "Hoje" : "Recente",
    }));
  }

  if (!summary) {
    return [];
  }

  const generated: AnomalyCard[] = [];

  if (summary.expense > summary.income) {
    generated.push({
      key: "negative-balance",
      title: "Saídas acima das entradas",
      description: "As despesas superaram as receitas no período selecionado.",
      actionLabel: "Revisar despesas",
      tone: "danger",
      timestamp: "Agora",
    });
  }

  if (summary.upcomingDueTotal > 0) {
    generated.push({
      key: "upcoming-dues",
      title: "Compromissos próximos",
      description: `${formatCurrency(summary.upcomingDueTotal)} em contas a vencer precisa de atenção no caixa.`,
      actionLabel: "Ver vencimentos",
      tone: "warning",
      timestamp: "Próximos 30d",
    });
  }

  return generated;
}

/**
 * Builds only actionable executive signals for the dashboard strip.
 *
 * @param summary Current dashboard summary.
 * @param rate Savings rate in percentage points.
 * @param anomalyCards Alert/anomaly cards already resolved for the period.
 * @returns Short signals that are worth user attention.
 */
function buildExecutiveSignals(
  summary: DashboardSummary | null,
  rate: number,
  anomalyCards: AnomalyCard[],
): ExecutiveSignal[] {
  if (!summary) {
    return [];
  }

  const signals: ExecutiveSignal[] = [];

  if (summary.income > 0 && rate < 20) {
    signals.push({
      key: "low-savings",
      icon: Sparkles,
      text: `Taxa de poupança em ${rate.toFixed(0)}%; tente chegar perto de 20%.`,
    });
  }

  if (summary.upcomingDueTotal > 0) {
    signals.push({
      key: "upcoming-dues",
      icon: CalendarClock,
      text: `${formatCurrency(summary.upcomingDueTotal)} em vencimentos próximos.`,
    });
  }

  if (anomalyCards.length > 0) {
    signals.push({
      key: "anomalies",
      icon: ShieldAlert,
      text: `${anomalyCards.length} sinal${anomalyCards.length === 1 ? "" : "es"} financeiro${anomalyCards.length === 1 ? "" : "s"} para revisão.`,
    });
  }

  return signals;
}

/**
 * Resolves the copy used by the savings-rate KPI.
 *
 * @param rate Savings rate in percentage points.
 * @returns Short status label.
 */
function resolveSavingsLabel(rate: number): string {
  return rate >= 20 ? "saudável" : "atenção";
}

/**
 * Resolves the trend tone used by the savings-rate KPI.
 *
 * @param rate Savings rate in percentage points.
 * @returns Visual trend tone.
 */
function resolveSavingsTone(rate: number): KpiCard["trendTone"] {
  return rate >= 20 ? "positive" : "negative";
}

/**
 * Builds the KPI card models from safe summary and comparison inputs.
 *
 * @param summary Current dashboard summary or null.
 * @param comparison Current period comparison or null.
 * @param rate Savings rate in percentage points.
 * @returns KPI cards shown in the executive row.
 */
function buildKpiCards(
  summary: DashboardSummary | null,
  comparison: DashboardComparison | null,
  rate: number,
): KpiCard[] {
  const safeSummary = summary ?? EMPTY_SUMMARY;
  const safeComparison = comparison ?? EMPTY_COMPARISON;

  return [
    {
      key: "income",
      label: "Receitas (Mês)",
      value: formatCurrency(safeSummary.income),
      trend: formatDelta(safeComparison.incomeVsPreviousMonthPercent),
      trendTone: resolveTrendTone(safeComparison.incomeVsPreviousMonthPercent),
      helper: "vs mês anterior",
      icon: ArrowUpRight,
      tone: "income",
    },
    {
      key: "expense",
      label: "Despesas (Mês)",
      value: formatCurrency(safeSummary.expense),
      trend: formatDelta(safeComparison.expenseVsPreviousMonthPercent),
      trendTone: resolveTrendTone(safeComparison.expenseVsPreviousMonthPercent, true),
      helper: "vs mês anterior",
      icon: ArrowDownRight,
      tone: "expense",
    },
    {
      key: "balance",
      label: "Saldo Líquido",
      value: formatCurrency(safeSummary.balance),
      trend: formatDelta(safeComparison.balanceVsPreviousMonthPercent),
      trendTone: resolveTrendTone(safeComparison.balanceVsPreviousMonthPercent),
      helper: "resultado do período",
      icon: Scale,
      tone: "balance",
    },
    {
      key: "savings-rate",
      label: "Taxa de poupança",
      value: `${rate.toFixed(1)}%`,
      trend: resolveSavingsLabel(rate),
      trendTone: resolveSavingsTone(rate),
      helper: "saldo / receitas",
      icon: Wallet,
      tone: "savings",
    },
  ];
}

/**
 * Builds the x-axis option for the combined cashflow chart.
 *
 * @param points Normalized cashflow points.
 * @param tokens Theme-aware chart tokens.
 * @returns ECharts category axis option.
 */
function buildCashflowXAxis(points: CashflowPoint[], tokens: ChartThemeTokens): EChartsOption["xAxis"] {
  return {
    type: "category",
    data: points.map((point) => point.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: tokens.border } },
    axisLabel: {
      color: tokens.mutedText,
      fontFamily: "Inter",
      fontSize: 11,
    },
  };
}

/**
 * Builds the y-axis option for the combined cashflow chart.
 *
 * @param tokens Theme-aware chart tokens.
 * @returns ECharts value axis option.
 */
function buildCashflowYAxis(tokens: ChartThemeTokens): EChartsOption["yAxis"] {
  return {
    type: "value",
    splitLine: {
      lineStyle: {
        color: tokens.grid,
        type: "dashed",
      },
    },
    axisLabel: {
      color: tokens.mutedText,
      fontFamily: "IBM Plex Mono",
      fontSize: 10,
      formatter: (value: number): string => formatCurrency(value).replace(",00", ""),
    },
  };
}

/**
 * Builds the series option for the combined cashflow chart.
 *
 * @param points Normalized cashflow points.
 * @param tokens Theme-aware chart tokens.
 * @returns ECharts series option.
 */
function buildCashflowSeries(points: CashflowPoint[], tokens: ChartThemeTokens): EChartsOption["series"] {
  return [
    {
      name: "Receitas",
      type: "bar",
      stack: "cashflow",
      barMaxWidth: 34,
      data: points.map((point) => point.income),
      itemStyle: {
        color: tokens.income,
        borderRadius: [6, 6, 0, 0],
        opacity: 0.86,
      },
    },
    {
      name: "Despesas",
      type: "bar",
      stack: "cashflow",
      barMaxWidth: 34,
      data: points.map((point) => -point.expense),
      itemStyle: {
        color: tokens.expense,
        borderRadius: [0, 0, 6, 6],
        opacity: 0.86,
      },
    },
    {
      name: "Saldo",
      type: "line",
      data: points.map((point) => point.balance),
      smooth: true,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: {
        color: tokens.balance,
        width: 3,
      },
      itemStyle: {
        color: tokens.balance,
      },
      areaStyle: {
        color: withAlpha(tokens.balance, 0.12),
      },
    },
  ];
}

/**
 * Builds the combined cashflow chart option.
 *
 * @param points Normalized cashflow points.
 * @param tokens Theme-aware chart tokens.
 * @returns ECharts option for bars and accumulated balance line.
 */
function buildCashflowOption(points: CashflowPoint[], tokens: ChartThemeTokens): EChartsOption {
  return {
    backgroundColor: "transparent",
    color: [tokens.income, tokens.expense, tokens.balance],
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.tooltipBackground,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
    },
    legend: {
      show: false,
    },
    grid: {
      left: 8,
      right: 16,
      top: 24,
      bottom: 8,
      containLabel: true,
    },
    xAxis: buildCashflowXAxis(points, tokens),
    yAxis: buildCashflowYAxis(tokens),
    series: buildCashflowSeries(points, tokens),
  };
}

const savingsRate = computed((): number => calculateSavingsRate(props.summary));

const kpiCards = computed<KpiCard[]>(() =>
  buildKpiCards(props.summary, props.comparison, savingsRate.value),
);

const cashflowPoints = computed<CashflowPoint[]>(() =>
  buildCashflowPoints(props.summary, props.timeseries, props.trends),
);

const cashflowOption = computed<EChartsOption>(() =>
  buildCashflowOption(cashflowPoints.value, chartTokens.value),
);

const categoryRows = computed<CategoryRow[]>(() =>
  buildCategoryRows(props.summary, props.expensesByCategory),
);

const activeCategory = computed<CategoryRow | null>(() => categoryRows.value[0] ?? null);

const transactionRows = computed<TransactionRow[]>(() =>
  buildTransactionRows(props.upcomingDues),
);

const anomalies = computed<AnomalyCard[]>(() =>
  buildAnomalies(props.summary, props.alerts),
);

const executiveSignals = computed<ExecutiveSignal[]>(() =>
  buildExecutiveSignals(props.summary, savingsRate.value, anomalies.value),
);

const chartUpdateKey = computed((): string =>
  cashflowPoints.value.map((point) => `${point.label}:${point.balance}`).join("|"),
);
</script>

<template>
  <section class="market-pulse" aria-label="Dashboard Market Pulse">
    <div v-if="props.loading" class="market-pulse__skeleton" aria-busy="true">
      <span />
      <span />
      <span />
    </div>

    <template v-else>
      <section class="market-pulse__kpis" aria-label="Indicadores principais">
        <article
          v-for="card in kpiCards"
          :key="card.key"
          class="market-kpi"
          :class="`market-kpi--${card.tone}`"
        >
          <div class="market-kpi__glow" aria-hidden="true" />
          <header class="market-kpi__header">
            <span class="market-kpi__label">{{ card.label }}</span>
            <span class="market-kpi__icon">
              <component :is="card.icon" :size="18" aria-hidden="true" />
            </span>
          </header>
          <strong class="market-kpi__value">{{ card.value }}</strong>
          <footer class="market-kpi__footer">
            <span
              class="market-kpi__trend"
              :class="`market-kpi__trend--${card.trendTone}`"
            >
              {{ card.trend }}
            </span>
            <span>{{ card.helper }}</span>
          </footer>
        </article>
      </section>

      <section
        v-if="executiveSignals.length > 0"
        class="market-pulse__insights"
        aria-label="Leitura executiva"
      >
        <article
          v-for="signal in executiveSignals"
          :key="signal.key"
          class="market-insight"
        >
          <component :is="signal.icon" :size="16" aria-hidden="true" />
          <span>{{ signal.text }}</span>
        </article>
      </section>

      <section
        class="market-pulse__workspace"
        :class="{ 'market-pulse__workspace--essential': props.mode === 'essential' }"
        aria-label="Workspace analítico"
      >
        <UiSurfaceCard class="market-panel market-panel--cashflow" padding="none">
          <header class="market-panel__header">
            <div>
              <h2>Fluxo de Caixa Acumulado</h2>
              <p>Análise de entradas, saídas e saldo no período</p>
            </div>
            <div class="market-legend" aria-label="Legenda do fluxo de caixa">
              <span class="market-legend__item market-legend__item--income">Receitas</span>
              <span class="market-legend__item market-legend__item--expense">Despesas</span>
              <span class="market-legend__item market-legend__item--balance">Saldo</span>
            </div>
          </header>
          <div class="market-panel__chart">
            <UiChart
              v-if="cashflowPoints.length > 0"
              :option="cashflowOption"
              :update-key="chartUpdateKey"
              height="330px"
            />
            <div v-else class="market-panel__empty">
              <LineChart :size="28" aria-hidden="true" />
              <strong>Sem série suficiente para montar o gráfico</strong>
              <span>Cadastre movimentações para liberar a leitura diária.</span>
            </div>
          </div>
        </UiSurfaceCard>

        <UiSurfaceCard
          v-if="props.mode === 'analytical'"
          class="market-panel market-panel--categories"
          padding="none"
        >
          <header class="market-panel__header">
            <div>
              <h2>Gastos por Categoria</h2>
              <p>Principais concentrações de saída</p>
            </div>
            <NButton quaternary circle size="small" aria-label="Exportar categorias">
              <template #icon>
                <Download :size="15" aria-hidden="true" />
              </template>
            </NButton>
          </header>

          <div v-if="activeCategory" class="category-focus">
            <NButton quaternary circle size="tiny" aria-label="Voltar categoria">
              <template #icon>
                <ChevronLeft :size="14" aria-hidden="true" />
              </template>
            </NButton>
            <div class="category-focus__copy">
              <span>{{ activeCategory.category }}</span>
              <strong>{{ formatCurrency(activeCategory.amount) }}</strong>
            </div>
            <span class="category-focus__share">{{ activeCategory.percentage.toFixed(0) }}% do total</span>
          </div>

          <div v-if="categoryRows.length > 0" class="category-list">
            <article
              v-for="category in categoryRows"
              :key="category.category"
              class="category-row"
            >
              <div class="category-row__icon">
                <PieChart :size="16" aria-hidden="true" />
              </div>
              <div class="category-row__body">
                <span>{{ category.category }}</span>
                <div class="category-row__track">
                  <span :style="{ width: `${Math.min(category.percentage, 100)}%` }" />
                </div>
              </div>
              <strong>{{ formatCurrency(category.amount) }}</strong>
            </article>
          </div>
          <div v-else class="market-panel__empty market-panel__empty--compact">
            <PieChart :size="24" aria-hidden="true" />
            <strong>Categorias ainda indisponíveis</strong>
            <span>As despesas categorizadas aparecem aqui.</span>
          </div>
        </UiSurfaceCard>
      </section>

      <section
        v-if="props.mode === 'analytical'"
        class="market-pulse__bottom"
        aria-label="Dados operacionais"
      >
        <UiSurfaceCard class="market-panel market-panel--transactions" padding="none">
          <header class="market-panel__header">
            <div>
              <h2>Transações Recentes</h2>
              <p>Compromissos do caixa para acompanhar agora</p>
            </div>
            <div class="market-table-tools">
              <NInput size="small" placeholder="Buscar..." class="market-table-tools__search">
                <template #prefix>
                  <Search :size="14" aria-hidden="true" />
                </template>
              </NInput>
              <NButton secondary size="small">
                <template #icon>
                  <Filter :size="14" aria-hidden="true" />
                </template>
                Filtrar
              </NButton>
            </div>
          </header>

          <div class="market-table-wrap">
            <table class="market-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody v-if="transactionRows.length > 0">
                <tr v-for="row in transactionRows" :key="row.id">
                  <td>
                    <span class="market-table__avatar">
                      <CircleDollarSign :size="16" aria-hidden="true" />
                    </span>
                    <strong>{{ row.description }}</strong>
                  </td>
                  <td>{{ row.category }}</td>
                  <td>{{ row.dueDate }}</td>
                  <td><span class="market-status">{{ row.status }}</span></td>
                  <td class="market-table__amount">- {{ formatCurrency(row.amount) }}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="5" class="market-table__empty">
                    Nenhum compromisso próximo encontrado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiSurfaceCard>

        <UiSurfaceCard class="market-panel market-panel--anomalies" padding="none">
          <header class="market-panel__header">
            <div>
              <h2>
                Anomalias Detectadas
                <span class="market-count">{{ anomalies.length }}</span>
              </h2>
              <p>Sinais que merecem revisão rápida</p>
            </div>
          </header>

          <div v-if="anomalies.length > 0" class="anomaly-list">
            <article
              v-for="anomaly in anomalies"
              :key="anomaly.key"
              class="anomaly-row"
              :class="`anomaly-row--${anomaly.tone}`"
            >
              <header>
                <strong>{{ anomaly.title }}</strong>
                <span>{{ anomaly.timestamp }}</span>
              </header>
              <p>{{ anomaly.description }}</p>
              <NButton secondary size="small">
                {{ anomaly.actionLabel }}
              </NButton>
            </article>
          </div>
          <div v-else class="market-panel__empty market-panel__empty--compact">
            <BadgeAlert :size="24" aria-hidden="true" />
            <strong>Nenhuma anomalia crítica</strong>
            <span>Os principais sinais de risco aparecerão aqui.</span>
          </div>
        </UiSurfaceCard>
      </section>
    </template>
  </section>
</template>

<style scoped>
.market-pulse {
  display: grid;
  gap: var(--space-4);
}

.market-pulse__skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.market-pulse__skeleton span {
  min-height: calc(var(--space-9) * 2);
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-bg-surface), var(--color-bg-elevated), var(--color-bg-surface));
  animation: market-pulse-loading 1.4s ease-in-out infinite;
}

.market-pulse__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.market-kpi {
  position: relative;
  overflow: hidden;
  min-height: calc(var(--space-9) * 2);
  padding: var(--space-4);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-lg);
}

.market-kpi__glow {
  position: absolute;
  inset-block-start: calc(var(--space-8) * -1);
  inset-inline-end: calc(var(--space-8) * -1);
  width: calc(var(--space-9) * 2);
  aspect-ratio: 1;
  border-radius: var(--radius-full);
  filter: blur(var(--space-6));
  opacity: 0.2;
}

.market-kpi--income .market-kpi__glow { background: var(--color-positive); }
.market-kpi--expense .market-kpi__glow { background: var(--color-negative); }
.market-kpi--balance .market-kpi__glow { background: var(--color-brand-500); }
.market-kpi--savings .market-kpi__glow { background: var(--color-accent); }

.market-kpi__header,
.market-kpi__footer,
.market-panel__header,
.market-legend,
.market-table-tools,
.category-focus,
.category-row,
.market-table td:first-child {
  display: flex;
  align-items: center;
}

.market-kpi__header {
  position: relative;
  justify-content: space-between;
  gap: var(--space-2);
  margin-block-end: var(--space-4);
}

.market-kpi__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.market-kpi__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-brand-500);
}

.market-kpi--income .market-kpi__icon { color: var(--color-positive); }
.market-kpi--expense .market-kpi__icon { color: var(--color-negative); }
.market-kpi--savings .market-kpi__icon { color: var(--color-accent); }

.market-kpi__value {
  position: relative;
  display: block;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-heading-sm);
  overflow-wrap: anywhere;
}

.market-kpi--balance .market-kpi__value {
  color: var(--color-brand-500);
}

.market-kpi__footer {
  position: relative;
  gap: var(--space-2);
  margin-block-start: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.market-kpi__trend {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
  font-weight: var(--font-weight-semibold);
}

.market-kpi__trend--positive {
  color: var(--color-positive);
  background: var(--color-positive-bg);
}

.market-kpi__trend--negative {
  color: var(--color-negative);
  background: var(--color-negative-bg);
}

.market-kpi__trend--neutral {
  color: var(--color-text-muted);
  background: var(--color-outline-ghost);
}

.market-pulse__insights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.market-insight {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: var(--space-px) solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.market-insight svg {
  color: var(--color-brand-500);
  flex-shrink: 0;
}

.market-pulse__workspace,
.market-pulse__bottom {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: var(--space-4);
}

.market-pulse__workspace--essential {
  grid-template-columns: 1fr;
}

.market-panel {
  overflow: hidden;
  min-width: 0;
}

.market-panel__header {
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border-block-end: var(--space-px) solid var(--color-outline-soft);
}

.market-panel__header h2 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.market-panel__header p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.market-legend {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}

.market-legend__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.market-legend__item::before {
  content: "";
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  background: currentColor;
}

.market-legend__item--income { color: var(--color-positive); }
.market-legend__item--expense { color: var(--color-negative); }
.market-legend__item--balance { color: var(--color-brand-500); }

.market-panel__chart {
  min-height: calc(var(--space-9) * 5);
  padding: var(--space-4);
}

.market-panel__empty {
  min-height: calc(var(--space-9) * 4);
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  text-align: center;
}

.market-panel__empty strong {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
}

.market-panel__empty--compact {
  min-height: calc(var(--space-9) * 3);
  padding: var(--space-4);
}

.category-focus {
  justify-content: space-between;
  gap: var(--space-3);
  margin: var(--space-4);
  padding-block-end: var(--space-3);
  border-block-end: var(--space-px) solid var(--color-outline-soft);
}

.category-focus__copy {
  display: grid;
  gap: var(--space-1);
  flex: 1;
}

.category-focus__copy span {
  color: var(--color-warning);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.category-focus__copy strong {
  font-family: var(--font-mono);
}

.category-focus__share {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.category-list,
.anomaly-list {
  display: grid;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-4);
}

.category-row {
  gap: var(--space-3);
  min-width: 0;
  padding-block: var(--space-2);
}

.category-row__icon,
.market-table__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.category-row__body {
  display: grid;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.category-row__body span {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-row__track {
  height: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
  overflow: hidden;
}

.category-row__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-brand-500), var(--color-accent));
}

.category-row strong,
.market-table__amount {
  color: var(--color-negative);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.market-table-tools {
  gap: var(--space-2);
}

.market-table-tools__search {
  width: calc(var(--space-9) * 3);
}

.market-table-wrap {
  overflow-x: auto;
}

.market-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.market-table th,
.market-table td {
  padding: var(--space-3) var(--space-4);
  border-block-end: var(--space-px) solid var(--color-outline-soft);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: start;
}

.market-table th {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.market-table td:first-child {
  gap: var(--space-2);
  color: var(--color-text-primary);
}

.market-table__empty {
  text-align: center;
}

.market-status {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border: var(--space-px) solid var(--color-warning-glow);
  border-radius: var(--radius-xs);
  color: var(--color-warning);
  background: var(--color-warning-bg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.market-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--space-5);
  height: var(--space-5);
  border: var(--space-px) solid var(--color-warning-glow);
  border-radius: var(--radius-full);
  color: var(--color-warning);
  background: var(--color-warning-bg);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.anomaly-row {
  display: grid;
  gap: var(--space-2);
  padding-block: var(--space-3);
  border-inline-start: var(--space-1) solid var(--color-warning);
  padding-inline-start: var(--space-3);
}

.anomaly-row--danger {
  border-inline-start-color: var(--color-negative);
}

.anomaly-row--info {
  border-inline-start-color: var(--color-brand-500);
}

.anomaly-row header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--color-text-primary);
}

.anomaly-row header span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.anomaly-row p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

@keyframes market-pulse-loading {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

@media (max-width: 1180px) {
  .market-pulse__kpis,
  .market-pulse__insights {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .market-pulse__workspace,
  .market-pulse__bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .market-pulse__kpis,
  .market-pulse__insights,
  .market-pulse__skeleton {
    grid-template-columns: 1fr;
  }

  .market-panel__header,
  .market-table-tools {
    align-items: stretch;
    flex-direction: column;
  }

  .market-table-tools__search {
    width: 100%;
  }

  .market-kpi__value {
    font-size: var(--font-size-xl);
  }
}
</style>
