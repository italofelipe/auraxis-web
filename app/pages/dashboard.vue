<script setup lang="ts">
import {
  DASHBOARD_PERIOD_OPTIONS,
  useDashboardOverviewQuery,
  type DashboardOverviewFilters,
} from "~/composables/useDashboard";
import DashboardAlerts from "~/features/dashboard/components/DashboardAlerts.vue";
import DashboardPeriodSelector from "~/features/dashboard/components/DashboardPeriodSelector.vue";
import DashboardSummaryGrid from "~/features/dashboard/components/DashboardSummaryGrid.vue";
import DashboardTimeseriesChart from "~/features/dashboard/components/DashboardTimeseriesChart.vue";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";
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
 * Determines whether the selected period can be managed by DashboardPeriodSelector.
 *
 * @returns Whether the selected period is a quick-select preset.
 */
const isQuickSelectPeriod = computed((): boolean => {
  return (
    selectedPeriod.value === "1m" ||
    selectedPeriod.value === "3m" ||
    selectedPeriod.value === "6m" ||
    selectedPeriod.value === "12m"
  );
});

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
        <DashboardPeriodSelector
          v-if="isQuickSelectPeriod"
          :model-value="(selectedPeriod as DashboardPeriod)"
          @period-change="(p: DashboardPeriod) => (selectedPeriod = p)"
        />

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
      <DashboardSummaryGrid
        :summary="summary"
        :comparison="comparison"
        :portfolio="portfolio"
        :upcoming-dues="upcomingDues"
        :is-loading="dashboardQuery.isLoading.value"
      />

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
          <DashboardTimeseriesChart
            :data="timeseries"
            :is-loading="dashboardQuery.isLoading.value"
          />

          <DashboardAlerts
            :alerts="alerts"
            :is-loading="dashboardQuery.isLoading.value"
          />

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

.support-copy,
.error-copy {
  margin: 0;
  color: var(--color-neutral-700);
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

.category-list,
.due-list,
.goal-list {
  display: grid;
  gap: var(--space-2);
}

.category-item,
.due-item,
.goal-item {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.45);
}

.category-item,
.due-item,
.goal-item__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  align-items: flex-start;
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
  display: block;
  height: 10px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, #ffab1a 0%, #ffbe4d 100%);
}

.category-item p,
.due-item p,
.goal-item p {
  margin: 0;
  color: var(--color-neutral-700);
}

@media (max-width: 1024px) {
  .dashboard-main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
