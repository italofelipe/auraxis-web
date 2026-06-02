<script setup lang="ts">
import { computed } from "vue";
import { NButton, NDatePicker } from "naive-ui";

import DashboardControlBar from "~/features/dashboard/components/DashboardControlBar.vue";
import DashboardMarketPulseWorkspace from "~/features/dashboard/components/DashboardMarketPulseWorkspace.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import SpendingInsightCard from "~/features/spending-patterns/components/SpendingInsightCard.vue";
import OnboardingSkipNudge from "~/features/onboarding/components/OnboardingSkipNudge.vue";
import { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";
import { useDashboardTrendsQuery } from "~/features/dashboard/queries/use-dashboard-trends-query";
import type {
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
const trendsMonths = ref<number>(6);
const trendsQuery = useDashboardTrendsQuery(trendsMonths);

const overview = computed(() => dashboardQuery.data.value);
const summary = computed(() => overview.value?.summary ?? null);
const comparison = computed(() => overview.value?.comparison ?? null);
const timeseries = computed(() => overview.value?.timeseries ?? []);
const upcomingDues = computed(() => overview.value?.upcomingDues ?? []);
const expensesByCategory = computed(() => overview.value?.expensesByCategory ?? []);
const alerts = computed(() => overview.value?.alerts ?? []);
const trendsSeries = computed(() => trendsQuery.data.value?.series ?? []);

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
        :upcoming-dues="upcomingDues"
        :alerts="alerts"
        :trends="trendsSeries"
        :mode="selectedMode"
        :loading="dashboardQuery.isLoading.value || trendsQuery.isLoading.value"
      />

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
