<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { NButton, NEmpty, NModal, NSpin } from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useDeleteTransactionMutation } from "~/features/transactions/queries/use-delete-transaction-mutation";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { buildDuplicatePayload } from "~/features/transactions/composables/useTransactionActions";
import {
  type CreditCardsView,
  useCreditCardsViewState,
} from "~/features/credit-cards/composables/useCreditCardsViewState";
import { useCreditCardsStatement } from "~/features/credit-cards/composables/useCreditCardsStatement";
import { useCreditCardsAnalytics } from "~/features/credit-cards/composables/useCreditCardsAnalytics";
import type { EnrichedTransaction } from "~/features/credit-cards/utils/transaction-billing";
import FaturasView from "~/features/credit-cards/components/FaturasView.vue";
import AnaliticoView from "~/features/credit-cards/components/AnaliticoView.vue";
import CreditCardExpenseModal from "~/features/credit-cards/components/CreditCardExpenseModal.vue";
import { useToast } from "~/composables/useToast";

definePageMeta({ middleware: ["authenticated", "coming-soon"] });

useHead({ title: "Cartão | Auraxis" });

const { t } = useI18n();
const route = useRoute();
const queryClient = useQueryClient();
const toast = useToast();

const cardId = computed<string>(() => String(route.params.id ?? ""));

const { data: creditCards, isLoading: cardsLoading } = useCreditCardsQuery();
const duplicateTransactionMutation = useCreateTransactionMutation();
const deleteTransactionMutation = useDeleteTransactionMutation();
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

const expenseModalVisible = ref(false);
const expenseModalTransaction = ref<TransactionDto | null>(null);
const expenseDeleteTarget = ref<TransactionDto | null>(null);

type ExpenseActionTarget = EnrichedTransaction | TransactionDto;

/**
 * Normaliza um alvo de ação vindo da fatura ou do modal para a transação canônica.
 *
 * @param target Item enriquecido da fatura ou DTO de transação.
 * @returns Transação fonte.
 */
const transactionFromExpenseTarget = (target: ExpenseActionTarget): TransactionDto =>
  "transaction" in target ? target.transaction : target;

/** Abre o modal de nova despesa com o cartão da rota pré-selecionado. */
const openExpense = (): void => {
  expenseModalTransaction.value = null;
  expenseModalVisible.value = true;
};

/**
 * Abre o modal de detalhes/edição de um lançamento da fatura.
 *
 * @param item Lançamento enriquecido com a transação fonte.
 */
const openExpenseEdit = (item: EnrichedTransaction): void => {
  expenseModalTransaction.value = item.transaction;
  expenseModalVisible.value = true;
};

/** Refresca fatura/utilização do cartão após mutações de despesa/transação. */
const invalidateTransactionSurfaces = (): void => {
  void queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
};

/**
 * Trata salvamento feito pelo modal de despesa.
 *
 * @param mode Modo salvo pelo modal.
 */
const onExpenseSaved = (mode: "created" | "updated"): void => {
  invalidateTransactionSurfaces();
  toast.success(
    mode === "created"
      ? "Despesa lançada e sincronizada com Transações"
      : "Despesa atualizada em Cartões e Transações",
  );
};

/**
 * Duplica uma despesa criando uma nova transação.
 *
 * @param target Item da fatura ou transação do modal.
 */
const duplicateExpense = (target: ExpenseActionTarget): void => {
  const transaction = transactionFromExpenseTarget(target);
  duplicateTransactionMutation.mutate(buildDuplicatePayload(transaction), {
    onSuccess: () => {
      expenseModalVisible.value = false;
      invalidateTransactionSurfaces();
      toast.success("Despesa duplicada");
    },
  });
};

/**
 * Abre a confirmação de remoção de uma despesa.
 *
 * @param target Item da fatura ou transação do modal.
 */
const requestRemoveExpense = (target: ExpenseActionTarget): void => {
  expenseDeleteTarget.value = transactionFromExpenseTarget(target);
};

/** Fecha a confirmação de remoção quando não há mutação pendente. */
const cancelExpenseDelete = (): void => {
  if (!deleteTransactionMutation.isPending.value) {
    expenseDeleteTarget.value = null;
  }
};

/** Remove a despesa confirmada da fatura e de Transações. */
const confirmExpenseDelete = (): void => {
  if (!expenseDeleteTarget.value) {
    return;
  }
  const deletedTransactionId = expenseDeleteTarget.value.id;
  deleteTransactionMutation.mutate(
    { id: deletedTransactionId, scope: "occurrence" },
    {
      onSuccess: () => {
        expenseDeleteTarget.value = null;
        if (expenseModalTransaction.value?.id === deletedTransactionId) {
          expenseModalVisible.value = false;
          expenseModalTransaction.value = null;
        }
        invalidateTransactionSurfaces();
        toast.success("Despesa removida de Cartões e Transações");
      },
    },
  );
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
        <NButton v-if="card" type="primary" data-testid="cc-detail-add-expense" @click="openExpense">
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
        @add-expense="openExpense"
        @edit-expense="openExpenseEdit"
        @duplicate-expense="duplicateExpense"
        @delete-expense="requestRemoveExpense"
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

    <NModal
      :show="expenseDeleteTarget !== null"
      preset="dialog"
      type="error"
      title="Remover despesa?"
      style="width: min(420px, calc(100vw - 32px))"
      :mask-closable="!deleteTransactionMutation.isPending.value"
      :close-on-esc="!deleteTransactionMutation.isPending.value"
      @close="cancelExpenseDelete"
    >
      <p class="cc-detail__delete-copy">
        <strong>{{ expenseDeleteTarget?.title }}</strong> será removida desta fatura
        e das Transações. Esta ação não pode ser desfeita.
      </p>
      <template #action>
        <NButton
          tertiary
          data-testid="cc-expense-delete-cancel"
          :disabled="deleteTransactionMutation.isPending.value"
          @click="cancelExpenseDelete"
        >
          Cancelar
        </NButton>
        <NButton
          type="error"
          data-testid="cc-expense-delete-confirm"
          :loading="deleteTransactionMutation.isPending.value"
          @click="confirmExpenseDelete"
        >
          Remover
        </NButton>
      </template>
    </NModal>

    <CreditCardExpenseModal
      v-model:visible="expenseModalVisible"
      :transaction="expenseModalTransaction"
      :preset-credit-card-id="cardId"
      @saved="onExpenseSaved"
      @duplicate="duplicateExpense"
      @remove="requestRemoveExpense"
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
.cc-detail__delete-copy {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
.cc-detail__delete-copy strong {
  color: var(--color-text-primary);
}
@media (max-width: 760px) {
  .cc-detail__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
