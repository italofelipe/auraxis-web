<script setup lang="ts">
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";

import { formatCurrency } from "~/utils/currency";
import type { DashboardSummaryGridProps } from "./DashboardSummaryGrid.types";

const { t } = useI18n();

const props = defineProps<DashboardSummaryGridProps>();
</script>

<template>
  <section class="summary-grid" :aria-label="$t('dashboard.summaryGrid.ariaLabel')">
    <UiMetricCard
      :label="t('dashboard.summaryGrid.balance')"
      :value="formatCurrency(props.summary?.balance ?? 0)"
      :trend="props.comparison?.balanceVsPreviousMonthPercent ?? undefined"
      :icon="Wallet"
      :loading="props.isLoading"
    />

    <UiMetricCard
      :label="t('dashboard.summaryGrid.income')"
      :value="formatCurrency(props.summary?.income ?? 0)"
      :trend="props.comparison?.incomeVsPreviousMonthPercent ?? undefined"
      :icon="ArrowUpCircle"
      :loading="props.isLoading"
    />

    <UiMetricCard
      :label="t('dashboard.summaryGrid.expense')"
      :value="formatCurrency(props.summary?.expense ?? 0)"
      :trend="props.comparison?.expenseVsPreviousMonthPercent ?? undefined"
      :icon="ArrowDownCircle"
      :loading="props.isLoading"
    />

    <UiMetricCard
      :label="t('dashboard.summaryGrid.upcomingDue')"
      :value="formatCurrency(props.summary?.upcomingDueTotal ?? 0)"
      :icon="AlertCircle"
      :loading="props.isLoading"
    />

    <UiMetricCard
      :label="t('dashboard.summaryGrid.netWorth')"
      :value="formatCurrency(props.summary?.netWorth ?? 0)"
      :trend="props.portfolio?.changePercent ?? undefined"
      :icon="TrendingUp"
      :loading="props.isLoading"
    />
  </section>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
}
</style>
