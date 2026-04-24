<script setup lang="ts">
import { computed } from "vue";
import { NButton, NDatePicker, NSelect } from "naive-ui";
import { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";
import { useDashboardSurvivalIndexQuery } from "~/features/dashboard/queries/use-dashboard-survival-index-query";
import { useDashboardTrendsQuery } from "~/features/dashboard/queries/use-dashboard-trends-query";
import {
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardOverviewFilters,
} from "~/features/dashboard/model/dashboard-overview";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";
import DashboardControlBar from "~/features/dashboard/components/DashboardControlBar.vue";
import DashboardCashflowTimeline from "~/features/dashboard/components/DashboardCashflowTimeline.vue";
import DashboardIncomeExpenseChart from "~/features/dashboard/components/DashboardIncomeExpenseChart.vue";
import DashboardInvestmentsPanel from "~/features/dashboard/components/DashboardInvestmentsPanel.vue";
import DashboardPeriodComparisonStrip from "~/features/dashboard/components/DashboardPeriodComparisonStrip.vue";
import DashboardSavingsRateCard from "~/features/dashboard/components/DashboardSavingsRateCard.vue";
import DashboardTrendsChart from "~/features/dashboard/components/DashboardTrendsChart.vue";
import OnboardingSkipNudge from "~/features/onboarding/components/OnboardingSkipNudge.vue";
import { useDueRangeQuery } from "~/features/transactions/queries/use-due-range-query";
import { useWalletEntriesQuery } from "~/features/wallet/queries/use-wallet-entries-query";
import { useFinancialHealthScore } from "~/features/dashboard/composables/useFinancialHealthScore";
import { formatCurrency } from "~/utils/currency";
import DashboardTopCategoriesChart from "~/components/dashboard/DashboardTopCategoriesChart/DashboardTopCategoriesChart.vue";
import SurvivalIndexCard from "~/components/dashboard/SurvivalIndexCard/SurvivalIndexCard.vue";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Dashboard financeiro",
  pageSubtitle: "Visão consolidada do período",
});

const selectedPeriod = ref<DashboardOverviewFilters["period"]>("current_month");
const customStartTs = ref<number | null>(null);
const customEndTs = ref<number | null>(null);

/**
 * Converts a timestamp (ms) to an ISO date string (YYYY-MM-DD).
 *
 * @param ts - The timestamp in milliseconds or null.
 * @returns ISO date string or undefined if null.
 */
function tsToDateStr(ts: number | null): string | undefined {
  if (!ts) {return undefined;}
  return new Date(ts).toISOString().slice(0, 10);
}

const filters = computed<DashboardOverviewFilters>(() => {
  if (selectedPeriod.value === "custom") {
    return {
      period: selectedPeriod.value,
      start: tsToDateStr(customStartTs.value),
      end: tsToDateStr(customEndTs.value),
    };
  }
  return { period: selectedPeriod.value };
});

const periodOptions = computed(() =>
  DASHBOARD_PERIOD_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value })),
);

const dashboardQuery = useDashboardOverviewQuery(filters);
const survivalIndexQuery = useDashboardSurvivalIndexQuery();
const survivalIndex = computed(() => survivalIndexQuery.data.value ?? null);
const walletEntriesQuery = useWalletEntriesQuery();

// Trends — separate query for multi-month income/expense chart
const trendsMonths = ref<number>(6);
const trendsQuery = useDashboardTrendsQuery(trendsMonths);
const trendsSeries = computed(() => trendsQuery.data.value?.series ?? []);

const overview = computed(() => dashboardQuery.data.value);
const summary = computed(() => overview.value?.summary ?? null);
const comparison = computed(() => overview.value?.comparison ?? null);
const timeseries = computed(() => overview.value?.timeseries ?? []);
const upcomingDues = computed(() => overview.value?.upcomingDues ?? []);
const expensesByCategory = computed(() => overview.value?.expensesByCategory ?? []);
const goals = computed(() => overview.value?.goals ?? []);
const alerts = computed(() => overview.value?.alerts ?? []);
const portfolio = computed(() => overview.value?.portfolio ?? null);
const walletEntries = computed(() => walletEntriesQuery.data.value ?? []);

/**
 * Reverse-engineers a previous-period summary from the current summary plus the
 * backend-provided `comparison` percentages. Used by the savings-rate card to
 * show period-over-period delta without a second round-trip.
 */
const previousSummary = computed(() => {
  const s = summary.value;
  const c = comparison.value;
  if (!s || !c) {return null;}
  /**
   * Recovers the previous-period value for a metric given the current value
   * and the percentage change reported by the backend.
   *
   * @param current Current-period value.
   * @param pct Percentage change vs previous period (null when not available).
   * @returns Previous-period value, or null when the percentage is missing.
   */
  const unwind = (current: number, pct: number | null): number | null => {
    if (pct === null) {return null;}
    const factor = 1 + pct / 100;
    if (factor === 0) {return null;}
    return current / factor;
  };
  const prevIncome = unwind(s.income, c.incomeVsPreviousMonthPercent);
  const prevExpense = unwind(s.expense, c.expenseVsPreviousMonthPercent);
  const prevBalance = unwind(s.balance, c.balanceVsPreviousMonthPercent);
  if (prevIncome === null || prevBalance === null) {return null;}
  return {
    income: prevIncome,
    expense: prevExpense ?? 0,
    balance: prevBalance,
    netWorth: 0,
    upcomingDueTotal: 0,
  };
});

// Due-range panel (PROD-14) — always shows next 30 days regardless of period selector.
const dueRangeFilters = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  return { start_date: today, end_date: end, per_page: 50, order_by: "overdue_first" as const };
});
const dueRangeQuery = useDueRangeQuery(dueRangeFilters);
const dueTransactions = computed(() => dueRangeQuery.data.value?.transactions ?? []);

// Health Score (PROD-01) — wallet entries + trends + dashboard summary + goals.
const healthScoreInput = computed(() => ({
  summary: summary.value,
  goals: goals.value,
  trends: trendsSeries.value,
  portfolioValue: portfolio.value?.currentValue ?? null,
  walletEntries: walletEntries.value,
}));
const { score: healthScore } = useFinancialHealthScore(healthScoreInput);
const isHealthScoreLoading = computed(
  () => dashboardQuery.isLoading.value || trendsQuery.isLoading.value || walletEntriesQuery.isLoading.value,
);

const isCustomPeriodIncomplete = computed(
  () => selectedPeriod.value === "custom" && (!customStartTs.value || !customEndTs.value),
);

const isEmptyStateQuickAddOpen = ref<boolean>(false);

/** Opens the first-transaction quick-add modal from the dashboard empty state. */
const openFirstTransactionForm = (): void => {
  isEmptyStateQuickAddOpen.value = true;
};

/** Closes the empty-state quick-add modal (on dismiss or success). */
const closeFirstTransactionForm = (): void => {
  isEmptyStateQuickAddOpen.value = false;
};

const isQuickSelectPeriod = computed((): boolean =>
  ["1m", "3m", "6m", "12m"].includes(selectedPeriod.value),
);

const emptyMessage = computed(() =>
  selectedPeriod.value === "custom"
    ? t("pages.dashboard.noDataCustom")
    : t("pages.dashboard.noDataPeriod"),
);
</script>

<template>
  <div class="dashboard-page">

    <OnboardingSkipNudge />

    <!-- ── Global Control Bar (DS Wave-2 #728) ──────────────────────────── -->
    <div class="dashboard-page__topbar">
      <DashboardControlBar
        :period="(selectedPeriod as DashboardPeriod)"
        @update:period="(p: DashboardPeriod) => (selectedPeriod = p)"
      />
      <DashboardQuickAdd />
    </div>

    <!-- ── Period controls ────────────────────────────────────────────────── -->
    <div class="dashboard-page__controls">
      <DashboardPeriodSelector
        v-if="isQuickSelectPeriod"
        :model-value="(selectedPeriod as DashboardPeriod)"
        @period-change="(p: DashboardPeriod) => (selectedPeriod = p)"
      />

      <div class="control-field">
        <span>{{ $t('pages.dashboard.period') }}</span>
        <NSelect
          v-model:value="selectedPeriod"
          :options="periodOptions"
          style="min-width: 160px;"
        />
      </div>

      <template v-if="selectedPeriod === 'custom'">
        <div class="control-field">
          <span>{{ $t('pages.dashboard.start') }}</span>
          <NDatePicker
            v-model:value="customStartTs"
            type="date"
            clearable
          />
        </div>
        <div class="control-field">
          <span>{{ $t('pages.dashboard.end') }}</span>
          <NDatePicker
            v-model:value="customEndTs"
            type="date"
            clearable
          />
        </div>
      </template>
    </div>

    <UiEmptyState
      v-if="isCustomPeriodIncomplete"
      icon="calendarCheck"
      :title="$t('pages.dashboard.selectInterval')"
      :description="$t('pages.dashboard.selectIntervalDesc')"
    />

    <template v-else>
      <!-- ── Overview-dependent widgets ──────────────────────────────────────
           When the overview query fails, these widgets show a single shared
           error card with retry. Widgets that query independently (trends,
           due-range) still render below. -->
      <UiSurfaceCard v-if="dashboardQuery.isError.value" class="dashboard-overview-error">
        <p class="support-copy">{{ $t('pages.dashboard.loadError') }}</p>
        <p class="error-copy">
          {{ dashboardQuery.error.value?.message ?? $t('pages.dashboard.unknownError') }}
        </p>
        <NButton type="default" @click="dashboardQuery.refetch()">
          {{ $t('pages.dashboard.retry') }}
        </NButton>
      </UiSurfaceCard>

      <template v-else>
        <DashboardSummaryGrid
          :summary="summary"
          :comparison="comparison"
          :portfolio="portfolio"
          :upcoming-dues="upcomingDues"
          :is-loading="dashboardQuery.isLoading.value"
        />

        <UiEmptyState
          v-if="!dashboardQuery.isLoading.value && !summary"
          icon="chartLine"
          :title="$t('pages.dashboard.noData')"
          :description="emptyMessage"
          :action-label="$t('pages.dashboard.registerFirstTransaction')"
          :secondary-label="$t('pages.dashboard.learnMore')"
          secondary-href="https://auraxis.com.br/sobre"
          @action="openFirstTransactionForm"
        >
          <template #illustration>
            <IllustrationEmptyDashboard />
          </template>
        </UiEmptyState>

        <template v-else>
          <!-- ── Period-over-period comparison ────────────────────────────── -->
          <DashboardPeriodComparisonStrip
            :comparison="comparison"
            :loading="dashboardQuery.isLoading.value"
          />

          <!-- ── Cashflow timeline (line chart from daily timeseries) ─────── -->
          <DashboardCashflowTimeline
            :points="timeseries"
            :loading="dashboardQuery.isLoading.value"
          />

          <!-- ── Health Score (PROD-01) ────────────────────────────────────── -->
          <section class="dashboard-health-grid">
            <FinancialHealthScore
              :result="healthScore"
              :loading="isHealthScoreLoading"
              class="dashboard-health-score"
            />
            <SurvivalIndexCard
              :data="survivalIndex"
              :loading="survivalIndexQuery.isLoading.value"
            />
          </section>

          <!-- ── Savings rate + investments allocation ─────────────────────── -->
          <section class="dashboard-insights-grid">
            <DashboardSavingsRateCard
              :summary="summary"
              :previous-summary="previousSummary"
              :loading="dashboardQuery.isLoading.value"
            />
            <DashboardInvestmentsPanel
              :entries="walletEntries"
              :loading="walletEntriesQuery.isLoading.value"
            />
          </section>

          <!-- ── ECharts panels ──────────────────────────────────────────────── -->
          <section class="dashboard-charts-grid">
            <DashboardIncomeExpenseChart
              :summary="summary"
              :loading="dashboardQuery.isLoading.value"
            />
            <DashboardTrendsChart
              :series="trendsSeries"
              :loading="trendsQuery.isLoading.value"
              :is-error="trendsQuery.isError.value"
              :selected-months="trendsMonths"
              @update:selected-months="(m: number) => (trendsMonths = m)"
              @retry="trendsQuery.refetch()"
            />
          </section>

          <!-- ── Top Expense Categories (PROD-460) ────────────────────────── -->
          <DashboardTopCategoriesChart
            :categories="expensesByCategory"
            :loading="dashboardQuery.isLoading.value"
            class="dashboard-categories-chart"
          />

          <section class="dashboard-main-grid">
            <DashboardAlerts
              :alerts="alerts"
              :is-loading="dashboardQuery.isLoading.value"
            />

            <DashboardTransactionsPanel
              :upcoming-dues="upcomingDues"
              :expenses-by-category="expensesByCategory"
              :is-loading="dashboardQuery.isLoading.value"
            />

            <UiSurfaceCard>
              <template #header>{{ $t('pages.dashboard.featuredGoals') }}</template>
              <BaseSkeleton v-if="dashboardQuery.isLoading.value" />
              <div v-else class="item-list">
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
                    {{ formatCurrency(goal.currentAmount) }} {{ $t('pages.dashboard.goalOf') }}
                    {{ formatCurrency(goal.targetAmount) }}
                  </p>
                </article>
                <UiEmptyState
                  v-if="goals.length === 0"
                  icon="target"
                  :title="$t('pages.dashboard.noGoals')"
                  :description="$t('pages.dashboard.noGoalsDesc')"
                  :compact="true"
                />
              </div>
            </UiSurfaceCard>
          </section>
        </template>
      </template>

      <!-- ── Due-date panel (PROD-14) ──────────────────────────────────────
           Independent of `dashboardQuery` — always renders when the period is
           valid, with its own loading + error states. -->
      <UiSurfaceCard class="dashboard-due-dates">
        <DueDateList
          :transactions="dueTransactions"
          :is-loading="dueRangeQuery.isLoading.value"
        />
      </UiSurfaceCard>
    </template>

    <QuickTransactionForm
      :visible="isEmptyStateQuickAddOpen"
      type="expense"
      @update:visible="closeFirstTransactionForm"
      @success="closeFirstTransactionForm"
    />
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: var(--space-3);
}

.dashboard-health-score {
  width: 100%;
}

.dashboard-health-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-2);
  align-items: stretch;
}

.dashboard-page__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.dashboard-page__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-2);
}

.control-field {
  display: grid;
  gap: var(--space-1);
}

.control-field span {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}


.support-copy {
  margin: 0;
  color: var(--color-text-muted);
}

.error-copy {
  margin-top: var(--space-1);
  color: var(--color-negative);
}

.dashboard-charts-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-2);
}

.dashboard-insights-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-2);
  align-items: stretch;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-2);
}

.item-list {
  display: grid;
  gap: var(--space-2);
}

.goal-item p {
  margin: 0;
  color: var(--color-text-muted);
}

.goal-item {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding: var(--space-2);
  background: var(--color-bg-elevated);
}

.goal-item__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  align-items: flex-start;
}

.goal-item__track {
  height: 10px;
  border-radius: var(--radius-lg);
  background: var(--color-outline-soft);
  overflow: hidden;
  margin-block: var(--space-1);
}

.goal-item__track span {
  display: block;
  height: 10px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%);
}

@media (max-width: 1024px) {
  .dashboard-charts-grid,
  .dashboard-insights-grid,
  .dashboard-main-grid,
  .dashboard-health-grid {
    grid-template-columns: 1fr;
  }
}
</style>
