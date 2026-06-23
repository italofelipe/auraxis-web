<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { NButton, NButtonGroup, NEmpty, NModal, NSpin } from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import type {
  CreateCreditCardPayload,
  CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateCreditCardMutation } from "~/features/credit-cards/queries/use-create-credit-card-mutation";
import { useUpdateCreditCardMutation } from "~/features/credit-cards/queries/use-update-credit-card-mutation";
import { useDeleteCreditCardMutation } from "~/features/credit-cards/queries/use-delete-credit-card-mutation";
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
import CreditCardForm from "~/features/credit-cards/components/CreditCardForm.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import { useToast } from "~/composables/useToast";

const { t } = useI18n();
const queryClient = useQueryClient();
const toast = useToast();

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Cartões",
  pageSubtitle: "Gerencie seus cartões e lance despesas",
});

useHead({ title: "Cartões | Auraxis" });

const { data: creditCards, isLoading } = useCreditCardsQuery();
const createMutation = useCreateCreditCardMutation();
const updateMutation = useUpdateCreditCardMutation();
const deleteMutation = useDeleteCreditCardMutation();
const duplicateTransactionMutation = useCreateTransactionMutation();
const deleteTransactionMutation = useDeleteTransactionMutation();

const cards = computed<CreditCardDto[]>(() => creditCards.value ?? []);

const { view, month, selectedCardId, monthLabel, setView, shiftMonth, selectCard } =
  useCreditCardsViewState();

const { statement } = useCreditCardsStatement(month, selectedCardId);
const { analytics } = useCreditCardsAnalytics(month, selectedCardId);

const viewOptions: { value: CreditCardsView; label: string }[] = [
  { value: "faturas", label: "Faturas" },
  { value: "analitico", label: "Analítico" },
];

const selectedCard = computed<CreditCardDto | null>(
  () => cards.value.find((card) => card.id === selectedCardId.value) ?? null,
);

// ── CRUD de cartão (preservado) ────────────────────────────────────────────
const showModal = ref(false);
const editingCard = ref<CreditCardDto | null>(null);
const deleteTarget = ref<CreditCardDto | null>(null);
const expenseModalVisible = ref(false);
const expenseModalTransaction = ref<TransactionDto | null>(null);
const expensePresetCardId = ref<string | null>(null);
const expenseDeleteTarget = ref<TransactionDto | null>(null);

const submitting = computed<boolean>(
  () => createMutation.isPending.value || updateMutation.isPending.value,
);

/** Abre o modal em modo criação. */
const openCreate = (): void => {
  editingCard.value = null;
  showModal.value = true;
};

/**
 * Abre o modal em modo edição.
 *
 * @param card Cartão a editar.
 */
const openEdit = (card: CreditCardDto): void => {
  editingCard.value = card;
  showModal.value = true;
};

/** Fecha o modal e limpa o cartão em edição. */
const closeModal = (): void => {
  showModal.value = false;
  editingCard.value = null;
};

/**
 * Persiste um cartão criado/editado e fecha o modal.
 *
 * @param payload Payload do formulário.
 */
const onSubmit = async (payload: CreateCreditCardPayload): Promise<void> => {
  if (editingCard.value) {
    await updateMutation.mutateAsync({ id: editingCard.value.id, ...payload });
  } else {
    await createMutation.mutateAsync(payload);
  }
  closeModal();
};

/**
 * Abre a confirmação de remoção sem mutar imediatamente.
 *
 * @param card Cartão que o usuário pretende remover.
 */
const openDeleteConfirm = (card: CreditCardDto): void => {
  deleteTarget.value = card;
};

/** Fecha a confirmação de remoção, exceto durante a operação. */
const cancelDelete = (): void => {
  if (!deleteMutation.isPending.value) {
    deleteTarget.value = null;
  }
};

/** Remove o cartão confirmado e fecha o diálogo. */
const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) {
    return;
  }
  await deleteMutation.mutateAsync(deleteTarget.value.id);
  deleteTarget.value = null;
};

type ExpenseActionTarget = EnrichedTransaction | TransactionDto;

/**
 * Normaliza um alvo de ação vindo da fatura ou do modal para a transação canônica.
 *
 * @param target Item enriquecido da fatura ou DTO de transação.
 * @returns Transação fonte.
 */
const transactionFromExpenseTarget = (target: ExpenseActionTarget): TransactionDto =>
  "transaction" in target ? target.transaction : target;

/**
 * Resolve o cartão associado a um alvo de despesa.
 *
 * @param target Item enriquecido da fatura ou DTO de transação.
 * @returns Id do cartão, quando houver.
 */
const cardIdFromExpenseTarget = (target: ExpenseActionTarget): string | null =>
  "transaction" in target
    ? target.creditCardId ?? target.transaction.credit_card_id
    : target.credit_card_id;

/**
 * Abre o lançador de despesa, pré-selecionando o cartão atual quando houver.
 */
const openExpense = (): void => {
  expenseModalTransaction.value = null;
  expensePresetCardId.value = selectedCard.value?.id ?? selectedCardId.value ?? null;
  expenseModalVisible.value = true;
};

/**
 * Abre o modal de detalhes/edição para um lançamento da fatura.
 *
 * @param item Lançamento enriquecido com a transação fonte.
 */
const openExpenseEdit = (item: EnrichedTransaction): void => {
  expenseModalTransaction.value = item.transaction;
  expensePresetCardId.value = item.creditCardId ?? item.transaction.credit_card_id;
  expenseModalVisible.value = true;
};

/** Invalida as queries adjacentes após mutações de despesa/transação. */
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
 * Duplica uma despesa criando uma nova transação com sufixo "(cópia)".
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
 * Abre a confirmação de remoção de uma despesa/transação.
 *
 * @param target Item da fatura ou transação do modal.
 */
const requestRemoveExpense = (target: ExpenseActionTarget): void => {
  const transaction = transactionFromExpenseTarget(target);
  expensePresetCardId.value = cardIdFromExpenseTarget(target);
  expenseDeleteTarget.value = transaction;
};

/** Fecha a confirmação de remoção da despesa quando não há mutação pendente. */
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
  <div class="cc-page">
    <div class="cc-page__header">
      <div class="cc-page__title-block">
        <span class="cc-page__title">{{ t("pages.settings.creditCards.title") }}</span>
        <span class="cc-page__subtitle">{{ t("pages.settings.creditCards.subtitle") }}</span>
      </div>
      <div class="cc-page__header-actions">
        <UiSegmentedControl
          v-if="cards.length"
          :model-value="view"
          :options="viewOptions"
          aria-label="Selecionar visão de cartões"
          @update:model-value="setView"
        />
        <NButtonGroup>
          <NButton size="medium" data-testid="cc-add-expense" @click="openExpense">
            <template #icon><UiIcon name="plus" :size="16" /></template>
            Lançar despesa
          </NButton>
          <NButton type="primary" size="medium" data-testid="cc-new" @click="openCreate">
            <template #icon><UiIcon name="creditCard" :size="16" /></template>
            {{ t("pages.settings.creditCards.newCard") }}
          </NButton>
        </NButtonGroup>
      </div>
    </div>

    <div v-if="isLoading" class="cc-page__loading">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="cards.length === 0"
      :description="t('pages.settings.creditCards.empty')"
    >
      <template #extra>
        <NButton type="primary" @click="openCreate">
          {{ t("pages.settings.creditCards.newCard") }}
        </NButton>
      </template>
    </NEmpty>

    <template v-else>
      <FaturasView
        v-if="view === 'faturas'"
        :statement="statement"
        :cards="cards"
        :selected-card-id="selectedCardId"
        @select-card="selectCard"
        @shift-month="shiftMonth"
        @add-expense="openExpense"
        @add-card="openCreate"
        @edit-card="openEdit"
        @delete-card="openDeleteConfirm"
        @edit-expense="openExpenseEdit"
        @duplicate-expense="duplicateExpense"
        @delete-expense="requestRemoveExpense"
      />
      <AnaliticoView
        v-else
        :analytics="analytics"
        :cards="cards"
        :selected-card-id="selectedCardId"
        :month-label="monthLabel"
        @select-card="selectCard"
        @shift-month="shiftMonth"
      />
    </template>

    <AiInsightSurface class="cc-page__insights" />

    <NModal
      v-model:show="showModal"
      preset="card"
      style="max-width: 540px"
      :title="editingCard ? t('pages.settings.creditCards.editCard') : t('pages.settings.creditCards.newCard')"
    >
      <CreditCardForm
        :key="editingCard?.id ?? 'new'"
        :card="editingCard"
        :submitting="submitting"
        @submit="onSubmit"
        @cancel="closeModal"
      />
    </NModal>

    <NModal
      :show="deleteTarget !== null"
      preset="dialog"
      type="error"
      title="Remover cartão?"
      style="width: min(440px, calc(100vw - 32px))"
      :mask-closable="!deleteMutation.isPending.value"
      :close-on-esc="!deleteMutation.isPending.value"
      @close="cancelDelete"
    >
      <p class="cc-delete-copy">
        Você está removendo <strong>{{ deleteTarget?.name }}</strong>.
        Esta ação é irreversível e o cartão deixará de aparecer no hub.
      </p>
      <template #action>
        <NButton
          tertiary
          data-testid="cc-delete-cancel"
          :disabled="deleteMutation.isPending.value"
          @click="cancelDelete"
        >
          Cancelar
        </NButton>
        <NButton
          type="error"
          data-testid="cc-delete-confirm"
          :loading="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          Remover
        </NButton>
      </template>
    </NModal>

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
      <p class="cc-delete-copy">
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
      :preset-credit-card-id="expensePresetCardId"
      @saved="onExpenseSaved"
      @duplicate="duplicateExpense"
      @remove="requestRemoveExpense"
    />
  </div>
</template>

<style scoped>
.cc-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.cc-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.cc-page__title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}
.cc-page__subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.75;
}
.cc-page__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.cc-page__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}
.cc-delete-copy {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
.cc-delete-copy strong {
  color: var(--color-text-primary);
}
@media (max-width: 760px) {
  .cc-page__header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
