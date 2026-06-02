<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { NAlert, NButton, NEmpty, NSpin, NStatistic, NTag } from "naive-ui";

import { useCreditCardBillQuery } from "~/features/credit-cards/queries/use-credit-card-bill-query";
import { formatCurrency } from "~/utils/currency";

definePageMeta({ middleware: ["authenticated", "coming-soon"] });

const { t } = useI18n();
const route = useRoute();

const cardId = computed<string>(() => String(route.params.id ?? ""));

/**
 * Mês corrente em YYYY-MM (usa o calendário local).
 *
 * @returns String no formato YYYY-MM.
 */
const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const month = ref<string>(currentMonth());

const billQuery = useCreditCardBillQuery(cardId, month);

const bill = computed(() => billQuery.data.value ?? null);
const isMissingCycle = computed<boolean>(() => {
  const err = billQuery.error.value as { code?: string } | null;
  return err?.code === "MISSING_CYCLE_CONFIG";
});

/**
 *
 * @param delta
 */
const shiftMonth = (delta: number): void => {
  const [y, m] = month.value.split("-").map(Number);
  const date = new Date((y ?? 2026), (m ?? 1) - 1 + delta, 1);
  month.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
</script>

<template>
  <div class="cc-bill">
    <header class="cc-bill__header">
      <NButton text @click="$router.back()">← {{ t("pages.settings.creditCards.bill.back") }}</NButton>
      <h1 class="cc-bill__title">{{ t("pages.settings.creditCards.bill.title") }}</h1>
      <div class="cc-bill__month">
        <NButton size="small" data-testid="cc-bill-prev" @click="shiftMonth(-1)">‹</NButton>
        <span class="cc-bill__month-label" data-testid="cc-bill-month">{{ month }}</span>
        <NButton size="small" data-testid="cc-bill-next" @click="shiftMonth(1)">›</NButton>
      </div>
    </header>

    <NAlert
      v-if="isMissingCycle"
      type="warning"
      :title="t('pages.settings.creditCards.bill.missingCycle')"
    />
    <div v-else-if="billQuery.isLoading.value" class="cc-bill__loading">
      <NSpin size="large" />
    </div>
    <NAlert
      v-else-if="billQuery.isError.value"
      type="error"
      :title="t('pages.settings.creditCards.bill.loadError')"
    />
    <template v-else-if="bill">
      <section class="cc-bill__totals">
        <NStatistic :label="t('pages.settings.creditCards.bill.total')">
          {{ formatCurrency(bill.totalAmount) }}
        </NStatistic>
        <NStatistic :label="t('pages.settings.creditCards.bill.paid')">
          {{ formatCurrency(bill.paidAmount) }}
        </NStatistic>
        <NStatistic :label="t('pages.settings.creditCards.bill.pending')">
          {{ formatCurrency(bill.pendingAmount) }}
        </NStatistic>
        <NTag :bordered="false" size="small">{{ bill.cycle.status }}</NTag>
      </section>

      <NEmpty
        v-if="bill.transactions.length === 0"
        :description="t('pages.settings.creditCards.bill.empty')"
        data-testid="cc-bill-empty"
      />
      <ul v-else class="cc-bill__tx" data-testid="cc-bill-tx">
        <li v-for="tx in bill.transactions" :key="tx.id" class="cc-bill__tx-item">
          <span class="cc-bill__tx-title">{{ tx.title }}</span>
          <span class="cc-bill__tx-status">{{ tx.status }}</span>
          <span class="cc-bill__tx-amount">{{ formatCurrency(tx.amount) }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.cc-bill {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cc-bill__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cc-bill__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.cc-bill__month {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cc-bill__month-label {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

.cc-bill__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}

.cc-bill__totals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.cc-bill__tx {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cc-bill__tx-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-bill__tx-amount {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

.cc-bill__tx-status {
  opacity: 0.7;
  font-size: var(--font-size-xs);
}
</style>
