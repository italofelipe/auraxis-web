<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { NButton, NEmpty, NSpin } from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import {
  type CreditCardsView,
  useCreditCardsViewState,
} from "~/features/credit-cards/composables/useCreditCardsViewState";
import { useCreditCardsStatement } from "~/features/credit-cards/composables/useCreditCardsStatement";
import { useCreditCardsAnalytics } from "~/features/credit-cards/composables/useCreditCardsAnalytics";
import FaturasView from "~/features/credit-cards/components/FaturasView.vue";
import AnaliticoView from "~/features/credit-cards/components/AnaliticoView.vue";
import CreditCardExpenseSheet from "~/features/credit-cards/components/CreditCardExpenseSheet.vue";

definePageMeta({ middleware: ["authenticated", "coming-soon"] });

useHead({ title: "Cartão | Auraxis" });

const { t } = useI18n();
const route = useRoute();
const queryClient = useQueryClient();

const cardId = computed<string>(() => String(route.params.id ?? ""));

const { data: creditCards, isLoading: cardsLoading } = useCreditCardsQuery();
const card = computed<CreditCardDto | null>(
  () => (creditCards.value ?? []).find((entry) => entry.id === cardId.value) ?? null,
);
const cards = computed<CreditCardDto[]>(() => (card.value ? [card.value] : []));

const { view, month, monthLabel, setView, shiftMonth } = useCreditCardsViewState({
  initialCardId: cardId.value,
});

const { statement } = useCreditCardsStatement(month, cardId);
const { analytics } = useCreditCardsAnalytics(month, cardId);

const viewOptions: { value: CreditCardsView; label: string }[] = [
  { value: "faturas", label: "Faturas" },
  { value: "analitico", label: "Analítico" },
];

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
      <NButton text data-testid="cc-detail-back" @click="navigateTo('/credit-cards')">
        <template #icon><UiIcon name="chevronLeft" :size="16" /></template>
        {{ t("pages.settings.creditCards.bill.back") }}
      </NButton>

      <div v-if="card" class="cc-detail__id">
        <h1 class="cc-detail__name">{{ card.name }}</h1>
        <span class="cc-detail__bank">{{ card.bank ?? "Cartão de crédito" }}</span>
      </div>

      <div class="cc-detail__actions">
        <UiSegmentedControl
          v-if="card"
          :model-value="view"
          :options="viewOptions"
          aria-label="Selecionar visão do cartão"
          @update:model-value="setView"
        />
        <NButton v-if="card" type="primary" data-testid="cc-detail-add-expense" @click="showExpenseForm = true">
          <template #icon><UiIcon name="plus" :size="16" /></template>
          Lançar despesa
        </NButton>
      </div>
    </header>

    <div v-if="cardsLoading" class="cc-detail__loading">
      <NSpin size="large" />
    </div>

    <template v-else-if="card">
      <FaturasView
        v-if="view === 'faturas'"
        :statement="statement"
        :cards="cards"
        :selected-card-id="cardId"
        single-card
        @shift-month="shiftMonth"
        @add-expense="showExpenseForm = true"
      />
      <AnaliticoView
        v-else
        :analytics="analytics"
        :cards="cards"
        :selected-card-id="cardId"
        :month-label="monthLabel"
        single-card
        @shift-month="shiftMonth"
      />
    </template>

    <NEmpty v-else :description="t('pages.settings.creditCards.empty')" />

    <CreditCardExpenseSheet
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
  gap: var(--space-3);
  flex-wrap: wrap;
}
.cc-detail__id {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cc-detail__name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.cc-detail__bank {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.cc-detail__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  flex-wrap: wrap;
}
.cc-detail__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}
@media (max-width: 760px) {
  .cc-detail__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
