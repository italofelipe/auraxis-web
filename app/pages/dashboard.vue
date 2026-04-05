<script setup lang="ts">
import { NButton, NDatePicker, NSelect } from "naive-ui";
import {
  DASHBOARD_PERIOD_OPTIONS,
  useDashboardOverviewQuery,
  type DashboardOverviewFilters,
} from "~/composables/useDashboard";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";
import { formatCurrency } from "~/utils/currency";

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

const overview = computed(() => dashboardQuery.data.value);
const summary = computed(() => overview.value?.summary ?? null);
const comparison = computed(() => overview.value?.comparison ?? null);
const timeseries = computed(() => overview.value?.timeseries ?? []);
const expensesByCategory = computed(() => overview.value?.expensesByCategory ?? []);
const upcomingDues = computed(() => overview.value?.upcomingDues ?? []);
const goals = computed(() => overview.value?.goals ?? []);
const alerts = computed(() => overview.value?.alerts ?? []);
const portfolio = computed(() => overview.value?.portfolio ?? null);

const isCustomPeriodIncomplete = computed(
  () => selectedPeriod.value === "custom" && (!customStartTs.value || !customEndTs.value),
);

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

    <!-- ── Quick-add bar ──────────────────────────────────────────────────── -->
    <div class="dashboard-page__topbar">
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

    <UiSurfaceCard v-else-if="dashboardQuery.isError.value">
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
        v-if="!dashboardQuery.isLoading.value && !summary && !dashboardQuery.isError.value"
        icon="chartLine"
        :title="$t('pages.dashboard.noData')"
        :description="emptyMessage"
      />

      <template v-else>
        <!-- ── ECharts panels ──────────────────────────────────────────────── -->
        <section class="dashboard-charts-grid">
          <DashboardIncomeExpenseChart
            :summary="summary"
            :loading="dashboardQuery.isLoading.value"
          />
          <DashboardTimelineEChart
            :timeseries="timeseries"
            :loading="dashboardQuery.isLoading.value"
          />
        </section>

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
  </div>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: var(--space-3);
}

.dashboard-page__topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
  .dashboard-main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
