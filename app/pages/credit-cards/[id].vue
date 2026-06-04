<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { NAlert, NButton, NEmpty, NSpin, NStatistic, NTag } from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreditCardBillQuery } from "~/features/credit-cards/queries/use-credit-card-bill-query";
import QuickTransactionForm from "~/components/transactions/QuickTransactionForm/QuickTransactionForm.vue";
import { formatCurrency } from "~/utils/currency";

definePageMeta({ middleware: ["authenticated", "coming-soon"] });

const { t } = useI18n();
const route = useRoute();
const queryClient = useQueryClient();

const cardId = computed<string>(() => String(route.params.id ?? ""));

const { data: creditCards, isLoading: cardsLoading } = useCreditCardsQuery();
const card = computed<CreditCardDto | null>(
  () => (creditCards.value ?? []).find((c) => c.id === cardId.value) ?? null,
);

/**
 * Mês corrente em YYYY-MM (calendário local).
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
 * Avança/retrocede o mês exibido.
 *
 * @param delta Número de meses a deslocar.
 */
const shiftMonth = (delta: number): void => {
  const [y, m] = month.value.split("-").map(Number);
  const date = new Date(y ?? 2026, (m ?? 1) - 1 + delta, 1);
  month.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const showExpenseForm = ref(false);

/** Refresca fatura/utilização do cartão após lançar uma despesa. */
const onExpenseCreated = (): void => {
  void queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
};
</script>

<template>
  <div class="cc-detail">
    <header class="cc-detail__header">
      <NButton text @click="navigateTo('/credit-cards')">
        ← {{ t("pages.settings.creditCards.bill.back") }}
      </NButton>
      <h1 class="cc-detail__title">{{ card?.name ?? t("pages.settings.creditCards.title") }}</h1>
      <NButton
        type="primary"
        size="small"
        data-testid="cc-add-expense"
        :disabled="!card"
        @click="showExpenseForm = true"
      >
        {{ t("pages.settings.creditCards.detail.addExpense") }}
      </NButton>
    </header>

    <div v-if="cardsLoading" class="cc-detail__loading">
      <NSpin size="large" />
    </div>

    <template v-else-if="card">
      <section class="cc-detail__meta">
        <NTag v-if="card.brand" size="small" :bordered="false">{{ card.brand }}</NTag>
        <span v-if="card.last_four_digits" class="cc-detail__digits">
          •••• {{ card.last_four_digits }}
        </span>
        <NStatistic
          v-if="card.limit_amount !== null"
          :label="t('pages.settings.creditCards.fields.limitAmount')"
        >
          {{ formatCurrency(card.limit_amount) }}
        </NStatistic>
        <NStatistic
          v-if="card.closing_day !== null"
          :label="t('pages.settings.creditCards.fields.closingDay')"
        >
          {{ card.closing_day }}
        </NStatistic>
        <NStatistic
          v-if="card.due_day !== null"
          :label="t('pages.settings.creditCards.fields.dueDay')"
        >
          {{ card.due_day }}
        </NStatistic>
      </section>

      <section class="cc-detail__bill">
        <div class="cc-detail__bill-head">
          <h2 class="cc-detail__bill-title">{{ t("pages.settings.creditCards.bill.title") }}</h2>
          <div class="cc-detail__month">
            <NButton size="small" data-testid="cc-bill-prev" @click="shiftMonth(-1)">‹</NButton>
            <span class="cc-detail__month-label" data-testid="cc-bill-month">{{ month }}</span>
            <NButton size="small" data-testid="cc-bill-next" @click="shiftMonth(1)">›</NButton>
          </div>
        </div>

        <NAlert
          v-if="isMissingCycle"
          type="warning"
          :title="t('pages.settings.creditCards.bill.missingCycle')"
        />
        <div v-else-if="billQuery.isLoading.value" class="cc-detail__loading">
          <NSpin size="large" />
        </div>
        <NAlert
          v-else-if="billQuery.isError.value"
          type="error"
          :title="t('pages.settings.creditCards.bill.loadError')"
        />
        <template v-else-if="bill">
          <div class="cc-detail__totals">
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
          </div>

          <NEmpty
            v-if="bill.transactions.length === 0"
            :description="t('pages.settings.creditCards.bill.empty')"
            data-testid="cc-bill-empty"
          />
          <ul v-else class="cc-detail__tx" data-testid="cc-bill-tx">
            <li v-for="tx in bill.transactions" :key="tx.id" class="cc-detail__tx-item">
              <span class="cc-detail__tx-title">{{ tx.title }}</span>
              <span class="cc-detail__tx-status">{{ tx.status }}</span>
              <span class="cc-detail__tx-amount">{{ formatCurrency(tx.amount) }}</span>
            </li>
          </ul>
        </template>
      </section>
    </template>

    <NEmpty v-else :description="t('pages.settings.creditCards.empty')" />

    <QuickTransactionForm
      v-model:visible="showExpenseForm"
      type="expense"
      :preset-credit-card-id="cardId"
      @success="onExpenseCreated"
    />
  </div>
</template>

<style scoped>
.cc-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cc-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cc-detail__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.cc-detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.cc-detail__digits {
  font-size: var(--font-size-sm);
  opacity: 0.7;
}

.cc-detail__bill {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cc-detail__bill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cc-detail__bill-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.cc-detail__month {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cc-detail__month-label {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

.cc-detail__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}

.cc-detail__totals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.cc-detail__tx {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cc-detail__tx-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-detail__tx-amount {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

.cc-detail__tx-status {
  opacity: 0.7;
  font-size: var(--font-size-xs);
}
</style>
