<script setup lang="ts">
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";

import type {
  DashboardComparison,
  DashboardPortfolio,
  DashboardSummary,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";

interface Props {
  summary: DashboardSummary | null;
  comparison: DashboardComparison | null;
  portfolio: DashboardPortfolio | null;
  upcomingDues: DashboardUpcomingDue[];
  isLoading: boolean;
}

const props = defineProps<Props>();

/**
 * Formats a comparison percentage for compact UI display.
 *
 * @param value Comparison percentage or null.
 * @returns User-facing percentage string with sign prefix.
 */
const formatPercent = (value: number | null): string => {
  if (value === null) {
    return "-";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Resolves the CSS class for a trend indicator.
 *
 * @param value Comparison percentage or null.
 * @returns CSS class name reflecting the trend tone.
 */
const trendClass = (value: number | null): string => {
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
</script>

<template>
  <section class="summary-grid" aria-label="Resumo do período">
    <!-- Saldo -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__label">Saldo do período</span>
        <Wallet class="summary-card__icon" :size="20" aria-hidden="true" />
      </div>
      <BaseSkeleton v-if="props.isLoading" class="summary-card__skeleton" />
      <template v-else>
        <p class="summary-card__value">{{ formatCurrency(props.summary?.balance ?? 0) }}</p>
        <p :class="trendClass(props.comparison?.balanceVsPreviousMonthPercent ?? null)" class="summary-card__trend">
          <TrendingUp
            v-if="(props.comparison?.balanceVsPreviousMonthPercent ?? 0) > 0"
            :size="14"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="(props.comparison?.balanceVsPreviousMonthPercent ?? 0) < 0"
            :size="14"
            aria-hidden="true"
          />
          {{ formatPercent(props.comparison?.balanceVsPreviousMonthPercent ?? null) }} vs período anterior
        </p>
      </template>
    </div>

    <!-- Receitas -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__label">Receitas</span>
        <ArrowUpCircle class="summary-card__icon summary-card__icon--income" :size="20" aria-hidden="true" />
      </div>
      <BaseSkeleton v-if="props.isLoading" class="summary-card__skeleton" />
      <template v-else>
        <p class="summary-card__value">{{ formatCurrency(props.summary?.income ?? 0) }}</p>
        <p :class="trendClass(props.comparison?.incomeVsPreviousMonthPercent ?? null)" class="summary-card__trend">
          <TrendingUp
            v-if="(props.comparison?.incomeVsPreviousMonthPercent ?? 0) > 0"
            :size="14"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="(props.comparison?.incomeVsPreviousMonthPercent ?? 0) < 0"
            :size="14"
            aria-hidden="true"
          />
          {{ formatPercent(props.comparison?.incomeVsPreviousMonthPercent ?? null) }} vs período anterior
        </p>
      </template>
    </div>

    <!-- Despesas -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__label">Despesas</span>
        <ArrowDownCircle class="summary-card__icon summary-card__icon--expense" :size="20" aria-hidden="true" />
      </div>
      <BaseSkeleton v-if="props.isLoading" class="summary-card__skeleton" />
      <template v-else>
        <p class="summary-card__value">{{ formatCurrency(props.summary?.expense ?? 0) }}</p>
        <p :class="trendClass(props.comparison?.expenseVsPreviousMonthPercent ?? null)" class="summary-card__trend">
          <TrendingUp
            v-if="(props.comparison?.expenseVsPreviousMonthPercent ?? 0) > 0"
            :size="14"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="(props.comparison?.expenseVsPreviousMonthPercent ?? 0) < 0"
            :size="14"
            aria-hidden="true"
          />
          {{ formatPercent(props.comparison?.expenseVsPreviousMonthPercent ?? null) }} vs período anterior
        </p>
      </template>
    </div>

    <!-- Contas a vencer -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__label">Contas a vencer</span>
        <AlertCircle class="summary-card__icon summary-card__icon--warning" :size="20" aria-hidden="true" />
      </div>
      <BaseSkeleton v-if="props.isLoading" class="summary-card__skeleton" />
      <template v-else>
        <p class="summary-card__value">{{ formatCurrency(props.summary?.upcomingDueTotal ?? 0) }}</p>
        <p class="trend trend--neutral summary-card__trend">
          {{ props.upcomingDues.length }} compromisso(s) no período
        </p>
      </template>
    </div>

    <!-- Patrimônio -->
    <div class="summary-card">
      <div class="summary-card__header">
        <span class="summary-card__label">Patrimônio total</span>
        <TrendingUp class="summary-card__icon" :size="20" aria-hidden="true" />
      </div>
      <BaseSkeleton v-if="props.isLoading" class="summary-card__skeleton" />
      <template v-else>
        <p class="summary-card__value">{{ formatCurrency(props.summary?.netWorth ?? 0) }}</p>
        <p :class="trendClass(props.portfolio?.changePercent ?? null)" class="summary-card__trend">
          <TrendingUp
            v-if="(props.portfolio?.changePercent ?? 0) > 0"
            :size="14"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="(props.portfolio?.changePercent ?? 0) < 0"
            :size="14"
            aria-hidden="true"
          />
          {{ formatPercent(props.portfolio?.changePercent ?? null) }} de variação
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-2);
}

.summary-card {
  border-radius: var(--radius-md);
  background: var(--color-surface-50);
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
  padding: var(--space-2);
  display: grid;
  gap: var(--space-1);
}

.summary-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-card__label {
  font-size: var(--font-size-body-sm);
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
}

.summary-card__icon {
  color: var(--color-neutral-500);
}

.summary-card__icon--income {
  color: #0b8f52;
}

.summary-card__icon--expense {
  color: #c75b39;
}

.summary-card__icon--warning {
  color: #d97706;
}

.summary-card__value {
  margin: 0;
  font-size: var(--font-size-heading-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading-lg);
}

.summary-card__trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-body-sm);
}

.summary-card__skeleton {
  height: 40px;
}

.trend {
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
</style>
