<script setup lang="ts">
import {
  DASHBOARD_PERIOD_OPTIONS,
  useDashboardOverviewQuery,
  type DashboardAlert,
  type DashboardOverviewFilters,
  type DashboardTimeseriesPoint,
} from "~/composables/useDashboard";
import { formatCurrency } from "~/utils/currency";

definePageMeta({ middleware: ["authenticated"] });

const selectedPeriod = ref<DashboardOverviewFilters["period"]>("current_month");
const customStart = ref("");
const customEnd = ref("");

const filters = computed<DashboardOverviewFilters>(() => {
  if (selectedPeriod.value === "custom") {
    return {
      period: selectedPeriod.value,
      start: customStart.value || undefined,
      end: customEnd.value || undefined,
    };
  }

  return {
    period: selectedPeriod.value,
  };
});

const dashboardQuery = useDashboardOverviewQuery(filters);

const overview = computed(() => dashboardQuery.data.value);
const summary = computed(() => overview.value?.summary ?? null);
const comparison = computed(() => overview.value?.comparison ?? null);
const timeseries = computed(() => overview.value?.timeseries ?? []);
const expensesByCategory = computed(() => overview.value?.expensesByCategory ?? []);
const upcomingDues = computed(() => overview.value?.upcomingDues ?? []);
const goals = computed(() => overview.value?.goals ?? []);
const alerts = computed(() => overview.value?.alerts ?? []);
const portfolio = computed(() => overview.value?.portfolio ?? null);

const isCustomPeriodIncomplete = computed(() => {
  return selectedPeriod.value === "custom" && (!customStart.value || !customEnd.value);
});

/**
 * Formats a comparison metric for compact UI display.
 *
 * @param value Comparison percentage.
 * @returns User-facing percentage string.
 */
const formatPercent = (value: number | null): string => {
  if (value === null) {
    return "-";
  }

  const signal = value > 0 ? "+" : "";
  return `${signal}${value.toFixed(1)}%`;
};

/**
 * Formats an ISO date to a compact PT-BR label.
 *
 * @param value ISO-like calendar date.
 * @returns Localized date label.
 */
const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

/**
 * Resolves the trend class for positive, neutral and negative comparison values.
 *
 * @param value Comparison percentage.
 * @returns CSS class name for the trend tone.
 */
const buildTrendClass = (value: number | null): string => {
  if (value === null) {
    return "trend trend--neutral";
  }

  if (value > 0) {
    return "trend trend--positive";
  }

  if (value < 0) {
    return "trend trend--negative";
  }

  return "trend trend--neutral";
};

/**
 * Computes proportional bar widths for the compact timeseries visualization.
 *
 * @param point Timeseries point to render.
 * @returns Width styles for income, expense and balance bars.
 */
const buildSeriesBarStyle = (
  point: DashboardTimeseriesPoint,
): Record<"income" | "expense" | "balance", { width: string }> => {
  const largestValue = Math.max(
    ...timeseries.value.flatMap((item) => [
      item.income,
      item.expense,
      Math.abs(item.balance),
    ]),
    1,
  );

  return {
    income: { width: `${(point.income / largestValue) * 100}%` },
    expense: { width: `${(point.expense / largestValue) * 100}%` },
    balance: { width: `${(Math.abs(point.balance) / largestValue) * 100}%` },
  };
};

/**
 * Resolves the visual tone for a dashboard alert card.
 *
 * @param alert Alert item.
 * @returns CSS class name for the alert tone.
 */
const buildAlertTone = (alert: DashboardAlert): string => {
  if (alert.type.includes("due") || alert.type.includes("negative")) {
    return "alert-card alert-card--warning";
  }

  if (alert.type.includes("goal")) {
    return "alert-card alert-card--info";
  }

  return "alert-card";
};

/**
 * Builds the empty-state copy for the current filter selection.
 *
 * @returns Empty-state message.
 */
const buildEmptyMessage = (): string => {
  if (selectedPeriod.value === "custom") {
    return "Nenhum dado encontrado para o período personalizado.";
  }

  return "Ainda não encontramos movimentações para o período selecionado.";
};
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-page__hero">
      <div>
        <p class="dashboard-page__eyebrow">Dashboard financeiro</p>
        <h1>{{ overview?.period.label ?? "Seu panorama financeiro" }}</h1>
        <p class="dashboard-page__description">
          Acompanhe entradas, saídas, alertas, metas e patrimônio em uma
          visão única do período.
        </p>
      </div>

      <div class="dashboard-page__controls">
        <label class="control-field">
          <span>Período</span>
          <select v-model="selectedPeriod">
            <option
              v-for="option in DASHBOARD_PERIOD_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <template v-if="selectedPeriod === 'custom'">
          <label class="control-field">
            <span>Início</span>
            <input v-model="customStart" type="date">
          </label>
          <label class="control-field">
            <span>Fim</span>
            <input v-model="customEnd" type="date">
          </label>
        </template>
      </div>
    </header>

    <UiBaseCard v-if="isCustomPeriodIncomplete" title="Período personalizado">
      <p class="support-copy">
        Para consultar um período personalizado, selecione a data inicial e a
        data final.
      </p>
    </UiBaseCard>

    <UiBaseCard v-else-if="dashboardQuery.isError.value" title="Não foi possível carregar a dashboard">
      <p class="support-copy">
        O overview do período não pôde ser carregado agora.
      </p>
      <p class="error-copy">
        {{ dashboardQuery.error.value?.message ?? "Erro desconhecido de integração." }}
      </p>
      <button class="retry-button" type="button" @click="dashboardQuery.refetch()">
        Tentar novamente
      </button>
    </UiBaseCard>

    <template v-else>
      <section class="summary-grid" aria-label="Resumo do período">
        <UiBaseCard title="Saldo do período">
          <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
          <template v-else>
            <p class="summary-value">{{ formatCurrency(summary?.balance ?? 0) }}</p>
            <p :class="buildTrendClass(comparison?.balanceVsPreviousMonthPercent ?? null)">
              {{ formatPercent(comparison?.balanceVsPreviousMonthPercent ?? null) }} vs período anterior
            </p>
          </template>
        </UiBaseCard>

        <UiBaseCard title="Receitas">
          <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
          <template v-else>
            <p class="summary-value">{{ formatCurrency(summary?.income ?? 0) }}</p>
            <p :class="buildTrendClass(comparison?.incomeVsPreviousMonthPercent ?? null)">
              {{ formatPercent(comparison?.incomeVsPreviousMonthPercent ?? null) }} vs período anterior
            </p>
          </template>
        </UiBaseCard>

        <UiBaseCard title="Despesas">
          <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
          <template v-else>
            <p class="summary-value">{{ formatCurrency(summary?.expense ?? 0) }}</p>
            <p :class="buildTrendClass(comparison?.expenseVsPreviousMonthPercent ?? null)">
              {{ formatPercent(comparison?.expenseVsPreviousMonthPercent ?? null) }} vs período anterior
            </p>
          </template>
        </UiBaseCard>

        <UiBaseCard title="Contas a vencer">
          <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
          <template v-else>
            <p class="summary-value">{{ formatCurrency(summary?.upcomingDueTotal ?? 0) }}</p>
            <p class="support-copy">{{ upcomingDues.length }} compromisso(s) no período</p>
          </template>
        </UiBaseCard>

        <UiBaseCard title="Patrimônio total">
          <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
          <template v-else>
            <p class="summary-value">{{ formatCurrency(summary?.netWorth ?? 0) }}</p>
            <p :class="buildTrendClass(portfolio?.changePercent ?? null)">
              {{ formatPercent(portfolio?.changePercent ?? null) }} de variação
            </p>
          </template>
        </UiBaseCard>
      </section>

      <UiBaseCard
        v-if="!dashboardQuery.isLoading.value && !summary && !dashboardQuery.isError.value"
        title="Sem dados para este período"
      >
        <p class="support-copy">
          {{ buildEmptyMessage() }} Assim que você registrar receitas, despesas, metas
          ou patrimônio, a dashboard começa a ganhar vida.
        </p>
      </UiBaseCard>

      <template v-else>
        <section class="dashboard-main-grid">
          <UiBaseCard title="Evolução do período">
            <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
            <div v-else class="series-list">
              <div
                v-for="point in timeseries"
                :key="point.date"
                class="series-item"
              >
                <div class="series-item__header">
                  <strong>{{ formatDate(point.date) }}</strong>
                  <span>{{ formatCurrency(point.balance) }}</span>
                </div>
                <div class="series-bars">
                  <span class="series-bars__income" :style="buildSeriesBarStyle(point).income" />
                  <span class="series-bars__expense" :style="buildSeriesBarStyle(point).expense" />
                  <span class="series-bars__balance" :style="buildSeriesBarStyle(point).balance" />
                </div>
              </div>
            </div>
          </UiBaseCard>

          <UiBaseCard title="Alertas e atenção">
            <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
            <div v-else class="alerts-list">
              <article
                v-for="alert in alerts"
                :key="`${alert.type}-${alert.title}`"
                :class="buildAlertTone(alert)"
              >
                <strong>{{ alert.title }}</strong>
                <p>{{ alert.description ?? "Sem detalhes adicionais." }}</p>
                <small v-if="alert.actionLabel">{{ alert.actionLabel }}</small>
              </article>
              <p v-if="alerts.length === 0" class="support-copy">
                Nenhum alerta importante para este período.
              </p>
            </div>
          </UiBaseCard>

          <UiBaseCard title="Despesas por categoria">
            <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
            <div v-else class="category-list">
              <article
                v-for="category in expensesByCategory"
                :key="category.category"
                class="category-item"
              >
                <div>
                  <strong>{{ category.category }}</strong>
                  <p>{{ formatCurrency(category.amount) }}</p>
                </div>
                <span>{{ category.percentage.toFixed(1) }}%</span>
              </article>
              <p v-if="expensesByCategory.length === 0" class="support-copy">
                Ainda não há categorias suficientes para mostrar a distribuição.
              </p>
            </div>
          </UiBaseCard>

          <UiBaseCard title="Próximos vencimentos">
            <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
            <div v-else class="due-list">
              <article
                v-for="due in upcomingDues"
                :key="due.id"
                class="due-item"
              >
                <div>
                  <strong>{{ due.description }}</strong>
                  <p>{{ due.category ?? "Sem categoria" }}</p>
                </div>
                <div class="due-item__meta">
                  <span>{{ formatDate(due.dueDate) }}</span>
                  <strong>{{ formatCurrency(due.amount) }}</strong>
                </div>
              </article>
              <p v-if="upcomingDues.length === 0" class="support-copy">
                Nenhum vencimento próximo neste período.
              </p>
            </div>
          </UiBaseCard>

          <UiBaseCard title="Metas em destaque">
            <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
            <div v-else class="goal-list">
              <article
                v-for="goal in goals"
                :key="goal.id"
                class="goal-item"
              >
                <div class="goal-item__header">
                  <strong>{{ goal.name }}</strong>
                  <span>{{ goal.progressPercent.toFixed(0) }}%</span>
                </div>
                <div class="goal-item__track">
                  <span :style="{ width: `${Math.min(goal.progressPercent, 100)}%` }" />
                </div>
                <p>
                  {{ formatCurrency(goal.currentAmount) }} de
                  {{ formatCurrency(goal.targetAmount) }}
                </p>
              </article>
              <p v-if="goals.length === 0" class="support-copy">
                Nenhuma meta ativa para o período selecionado.
              </p>
            </div>
          </UiBaseCard>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: var(--space-3);
}

.dashboard-page__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: flex-start;
  flex-wrap: wrap;
}

.dashboard-page__eyebrow {
  margin: 0 0 var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-body-sm);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.dashboard-page h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-lg);
}

.dashboard-page__description {
  margin: var(--space-1) 0 0;
  color: var(--color-neutral-700);
  max-width: 680px;
}

.dashboard-page__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
  min-width: min(100%, 420px);
}

.control-field {
  display: grid;
  gap: var(--space-1);
}

.control-field span {
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
}

.control-field select,
.control-field input,
.retry-button {
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding-inline: var(--space-2);
  font: inherit;
  background: var(--color-surface-50);
}

.retry-button {
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-2);
}

.summary-value {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-heading-lg);
  line-height: var(--line-height-heading-lg);
  font-weight: var(--font-weight-bold);
}

.trend,
.support-copy,
.error-copy {
  margin: 0;
  color: var(--color-neutral-700);
}

.trend--positive {
  color: #0b8f52;
}

.trend--negative {
  color: #c75b39;
}

.trend--neutral {
  color: var(--color-neutral-600);
}

.error-copy {
  margin-top: var(--space-1);
  color: #b24526;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-2);
}

.series-list,
.alerts-list,
.category-list,
.due-list,
.goal-list {
  display: grid;
  gap: var(--space-2);
}

.series-item,
.category-item,
.due-item,
.goal-item,
.alert-card {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.45);
}

.series-item__header,
.category-item,
.due-item,
.goal-item__header {
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

.series-bars span,
.goal-item__track span {
  display: block;
  height: 10px;
  border-radius: var(--radius-lg);
}

.series-bars__income {
  background: rgba(35, 133, 84, 0.8);
}

.series-bars__expense {
  background: rgba(199, 91, 57, 0.82);
}

.series-bars__balance {
  background: rgba(255, 190, 77, 0.85);
}

.due-item__meta {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.goal-item__track {
  height: 10px;
  border-radius: var(--radius-lg);
  background: rgba(38, 33, 33, 0.12);
  overflow: hidden;
  margin-block: var(--space-1);
}

.goal-item__track span {
  background: linear-gradient(90deg, #ffab1a 0%, #ffbe4d 100%);
}

.alert-card {
  display: grid;
  gap: 6px;
}

.alert-card p,
.alert-card small,
.category-item p,
.due-item p,
.goal-item p {
  margin: 0;
  color: var(--color-neutral-700);
}

.alert-card--warning {
  border-color: rgba(199, 91, 57, 0.38);
  background: rgba(199, 91, 57, 0.08);
}

.alert-card--info {
  border-color: rgba(255, 171, 26, 0.36);
  background: rgba(255, 190, 77, 0.12);
}

@media (max-width: 1024px) {
  .dashboard-main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
