<script setup lang="ts">
import { computed } from "vue";
import { NButton, NDatePicker } from "naive-ui";

import DashboardControlBar from "~/features/dashboard/components/DashboardControlBar.vue";
import WeeklySnapshotCard from "~/features/weekly-snapshot/components/WeeklySnapshotCard.vue";
import DashboardMarketPulseWorkspace from "~/features/dashboard/components/DashboardMarketPulseWorkspace.vue";
import DashboardCalendarPanel from "~/features/dashboard/components/DashboardCalendarPanel.vue";
import DashboardInsightCarousel, {
  type CarouselDue,
  type CarouselGoal,
  type CarouselHealth,
} from "~/features/dashboard/components/DashboardInsightCarousel.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import SpendingInsightCard from "~/features/spending-patterns/components/SpendingInsightCard.vue";
import OnboardingSkipNudge from "~/features/onboarding/components/OnboardingSkipNudge.vue";
import { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";
import { useDashboardTrendsQuery } from "~/features/dashboard/queries/use-dashboard-trends-query";
import { useFinancialHealthScore } from "~/features/dashboard/composables/useFinancialHealthScore";
import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { useDueRangeQuery } from "~/features/transactions/queries/use-due-range-query";
import type {
  DashboardGoalSummary,
  DashboardOverviewFilters,
  DashboardPeriodPreset,
} from "~/features/dashboard/model/dashboard-overview";

type DashboardViewMode = "analytical" | "essential";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Dashboard financeiro",
  pageSubtitle: "Visão consolidada do período",
});

const selectedPeriod = ref<DashboardPeriodPreset>("current_month");
const selectedMode = ref<DashboardViewMode>("analytical");
const customStartTs = ref<number | null>(null);
const customEndTs = ref<number | null>(null);
const isEmptyStateQuickAddOpen = ref<boolean>(false);

/**
 * Converts a timestamp in milliseconds to an ISO date string.
 *
 * @param ts Timestamp in milliseconds or null.
 * @returns ISO date string or undefined.
 */
function tsToDateStr(ts: number | null): string | undefined {
  if (!ts) {
    return undefined;
  }

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

const dashboardQuery = useDashboardOverviewQuery(filters);
// 12 months powers the chronological cash-flow timeline (retrospective + now).
const trendsMonths = ref<number>(12);
const trendsQuery = useDashboardTrendsQuery(trendsMonths);

const overview = computed(() => dashboardQuery.data.value);
const summary = computed(() => overview.value?.summary ?? null);
const comparison = computed(() => overview.value?.comparison ?? null);
const timeseries = computed(() => overview.value?.timeseries ?? []);
const expensesByCategory = computed(() => overview.value?.expensesByCategory ?? []);
const trendsSeries = computed(() => trendsQuery.data.value?.series ?? []);

// ── Insight carousel data (replaces the empty month-over-month strip) ─────────
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const UPCOMING_WINDOW_DAYS = 30;

/**
 * Formats a Date as the YYYY-MM-DD key expected by the due-range endpoint.
 *
 * @param date Date to format.
 * @returns ISO date string.
 */
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const goalsQuery = useGoalsQuery();
// The due-range endpoint requires at least one of start_date/end_date (400
// otherwise), so always scope the upcoming-bills window explicitly.
const dueRangeFilters = computed(() => {
  const start = new Date();
  const end = new Date(start.getTime() + UPCOMING_WINDOW_DAYS * MS_PER_DAY);
  return { start_date: toDateKey(start), end_date: toDateKey(end) };
});
const dueRangeQuery = useDueRangeQuery(dueRangeFilters);

const carouselDues = computed<CarouselDue[]>(() => {
  const items = dueRangeQuery.data.value?.transactions ?? [];
  const todayMs = new Date(new Date().toISOString().slice(0, 10)).getTime();
  return items
    .filter((tx) => tx.type === "expense" && tx.status !== "paid" && tx.status !== "cancelled")
    .slice(0, 5)
    .map((tx) => {
      const dueMs = new Date(`${tx.due_date}T00:00:00`).getTime();
      const daysLeft = Math.round((dueMs - todayMs) / MS_PER_DAY);
      return {
        id: tx.id,
        title: tx.title,
        amount: Number(tx.amount),
        dueDate: tx.due_date,
        daysLeft: Math.max(daysLeft, 0),
        overdue: tx.status === "overdue" || daysLeft < 0,
      };
    });
});

const carouselGoals = computed<CarouselGoal[]>(() =>
  (goalsQuery.data.value ?? [])
    .filter((goal) => goal.status === "active")
    .slice(0, 4)
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      current: goal.current_amount,
      target: goal.target_amount,
      percent: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
    })),
);

const carouselExpenses = computed(() =>
  [...expensesByCategory.value].sort((a, b) => b.amount - a.amount).slice(0, 5),
);

const healthGoals = computed<DashboardGoalSummary[]>(() =>
  (goalsQuery.data.value ?? [])
    .filter((goal) => goal.status === "active")
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      progressPercent:
        goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      targetDate: goal.target_date ?? null,
    })),
);

const { score: healthScore } = useFinancialHealthScore(
  computed(() => ({
    summary: summary.value,
    goals: healthGoals.value,
    trends: trendsSeries.value,
    portfolioValue: null,
    walletEntries: [],
  })),
);

const carouselHealth = computed<CarouselHealth | null>(() =>
  summary.value
    ? { score: healthScore.value.totalScore, tier: healthScore.value.tier }
    : null,
);

const isCustomPeriodIncomplete = computed(
  () => selectedPeriod.value === "custom" && (!customStartTs.value || !customEndTs.value),
);

const currentMonthLabel = computed(() =>
  new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
);

const emptyStateTitle = computed(() =>
  selectedPeriod.value === "current_month"
    ? t("pages.dashboard.noDataCurrentMonthTitle", { month: currentMonthLabel.value })
    : t("pages.dashboard.noData"),
);

const emptyMessage = computed(() => {
  if (selectedPeriod.value === "custom") {
    return t("pages.dashboard.noDataCustom");
  }
  if (selectedPeriod.value === "current_month") {
    return t("pages.dashboard.noDataCurrentMonth", { month: currentMonthLabel.value });
  }
  return t("pages.dashboard.noDataPeriod");
});

/** Opens the first-transaction quick-add modal from the dashboard empty state. */
const openFirstTransactionForm = (): void => {
  isEmptyStateQuickAddOpen.value = true;
};

/** Closes the empty-state quick-add modal on dismiss or success. */
const closeFirstTransactionForm = (): void => {
  isEmptyStateQuickAddOpen.value = false;
};
</script>

<template>
  <div class="dashboard-page">
    <OnboardingSkipNudge />

    <section class="dashboard-page__command-bar" aria-label="Controles do dashboard">
      <DashboardControlBar
        :period="selectedPeriod"
        :mode="selectedMode"
        @update:period="(period: DashboardPeriodPreset) => (selectedPeriod = period)"
        @update:mode="(mode: DashboardViewMode) => (selectedMode = mode)"
      />
      <DashboardQuickAdd />
    </section>

    <section
      v-if="selectedPeriod === 'custom'"
      class="dashboard-page__custom-range"
      aria-label="Intervalo personalizado"
    >
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
    </section>

    <UiEmptyState
      v-if="isCustomPeriodIncomplete"
      icon="calendarCheck"
      :title="$t('pages.dashboard.selectInterval')"
      :description="$t('pages.dashboard.selectIntervalDesc')"
    />

    <template v-else>
      <UiSurfaceCard v-if="dashboardQuery.isError.value" class="dashboard-overview-error">
        <p class="support-copy">{{ $t('pages.dashboard.loadError') }}</p>
        <p class="error-copy">
          {{ dashboardQuery.error.value?.message ?? $t('pages.dashboard.unknownError') }}
        </p>
        <NButton type="default" @click="dashboardQuery.refetch()">
          {{ $t('pages.dashboard.retry') }}
        </NButton>
      </UiSurfaceCard>

      <DashboardMarketPulseWorkspace
        v-else
        :summary="summary"
        :comparison="comparison"
        :timeseries="timeseries"
        :expenses-by-category="expensesByCategory"
        :trends="trendsSeries"
        :mode="selectedMode"
        :loading="dashboardQuery.isLoading.value || trendsQuery.isLoading.value"
      />

      <DashboardInsightCarousel
        v-if="!dashboardQuery.isError.value && summary"
        class="dashboard-page__carousel"
        :upcoming-dues="carouselDues"
        :goals="carouselGoals"
        :top-expenses="carouselExpenses"
        :health="carouselHealth"
      />

      <DashboardCalendarPanel
        v-if="!dashboardQuery.isError.value && summary"
        class="dashboard-page__calendar"
      />

      <WeeklySnapshotCard class="dashboard-page__weekly-snapshot" />

      <AiInsightSurface class="dashboard-page__ai-insights" />

      <SpendingInsightCard class="dashboard-page__spending-insight" />

      <UiEmptyState
        v-if="!dashboardQuery.isLoading.value && !summary"
        icon="chartLine"
        :title="emptyStateTitle"
        :description="emptyMessage"
        :action-label="$t('pages.dashboard.registerFirstTransaction')"
        :secondary-label="$t('pages.dashboard.learnMore')"
        secondary-href="https://auraxis.com.br/sobre"
        compact
        @action="openFirstTransactionForm"
      >
        <template #illustration>
          <IllustrationEmptyDashboard />
        </template>
      </UiEmptyState>
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
  gap: var(--space-4);
}

.dashboard-page__command-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.dashboard-page__custom-range {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}

.dashboard-page__ai-insights {
  display: grid;
  gap: var(--space-3);
  align-items: start;
}

.control-field {
  display: grid;
  gap: var(--space-1);
}

.control-field span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.support-copy {
  margin: 0;
  color: var(--color-text-muted);
}

.error-copy {
  margin-block-start: var(--space-1);
  color: var(--color-negative);
}

@media (max-width: 920px) {
  .dashboard-page__command-bar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
