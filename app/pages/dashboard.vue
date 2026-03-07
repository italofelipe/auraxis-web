<script setup lang="ts">
import {
  useDashboardMonthQuery,
  useDashboardOverviewQuery,
} from "~/composables/useDashboard";
import { formatCurrency } from "~/utils/currency";
import { formatMonth } from "~/utils/month";

definePageMeta({ middleware: ["authenticated"] });

const selectedMonth = ref("2026-02");
const overviewQuery = useDashboardOverviewQuery();
const monthQuery = useDashboardMonthQuery(() => selectedMonth.value);

const monthOptions = computed(() => {
  const overview = overviewQuery.data.value;

  if (!overview) {
    return [];
  }

  return overview.monthly.map((item) => ({
    value: item.month,
    label: formatMonth(item.month),
  }));
});
</script>

<template>
  <div class="dashboard-grid">
    <UiBaseCard title="Saldo geral">
      <BaseSkeleton v-if="overviewQuery.isLoading.value" />
      <p v-else class="value-text">{{ formatCurrency(overviewQuery.data.value?.currentBalance ?? 0) }}</p>
    </UiBaseCard>

    <UiBaseCard title="Resumo por mes">
      <label class="month-label">
        Selecionar mes
        <select v-model="selectedMonth">
          <option
            v-for="option in monthOptions"
            :key="option.value"
            :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <BaseSkeleton v-if="monthQuery.isLoading.value" />
      <div v-else class="month-values">
        <p>Receitas: {{ formatCurrency(monthQuery.data.value?.incomes ?? 0) }}</p>
        <p>Despesas: {{ formatCurrency(monthQuery.data.value?.expenses ?? 0) }}</p>
        <p>Saldo: {{ formatCurrency(monthQuery.data.value?.balance ?? 0) }}</p>
      </div>
    </UiBaseCard>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-2);
}

.value-text {
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.month-label {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
}

.month-label select {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  min-height: 40px;
  padding-inline: var(--space-1);
}

.month-values {
  display: grid;
  gap: var(--space-1);
}

.month-values p {
  margin: 0;
}
</style>
