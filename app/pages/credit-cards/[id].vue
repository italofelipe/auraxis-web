<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { ArrowLeft } from "lucide-vue-next";
import { NButton, NEmpty, NSpin } from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreditCardBillQuery } from "~/features/credit-cards/queries/use-credit-card-bill-query";
import { useCreditCardUtilizationQuery } from "~/features/credit-cards/queries/use-credit-card-utilization-query";
import CreditCardDashboard from "~/features/credit-cards/components/CreditCardDashboard.vue";
import CreditCardExpenseDrawer from "~/features/credit-cards/components/CreditCardExpenseDrawer.vue";

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
const utilizationQuery = useCreditCardUtilizationQuery(cardId);
const utilization = computed(() => utilizationQuery.data.value ?? null);

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
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
};
</script>

<template>
  <div class="cc-detail">
    <header class="cc-detail__header">
      <NButton text @click="navigateTo('/credit-cards')">
        <template #icon><ArrowLeft :size="16" /></template>
        {{ t("pages.settings.creditCards.bill.back") }}
      </NButton>
    </header>

    <div v-if="cardsLoading" class="cc-detail__loading">
      <NSpin size="large" />
    </div>

    <CreditCardDashboard
      v-else-if="card"
      :card="card"
      :bill="bill"
      :utilization="utilization"
      :month="month"
      :loading="billQuery.isLoading.value || utilizationQuery.isLoading.value"
      :error="billQuery.isError.value"
      @add-expense="showExpenseForm = true"
      @shift-month="shiftMonth"
    />

    <NEmpty v-else :description="t('pages.settings.creditCards.empty')" />

    <CreditCardExpenseDrawer
      v-model:visible="showExpenseForm"
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
  justify-content: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cc-detail__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}
</style>
