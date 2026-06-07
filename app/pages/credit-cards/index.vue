<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import { NButton, NModal, NSpin } from "naive-ui";
import { CreditCard, Landmark, Plus, ReceiptText, ShieldCheck } from "lucide-vue-next";

import type {
  CreateCreditCardPayload,
  CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateCreditCardMutation } from "~/features/credit-cards/queries/use-create-credit-card-mutation";
import { useUpdateCreditCardMutation } from "~/features/credit-cards/queries/use-update-credit-card-mutation";
import { useDeleteCreditCardMutation } from "~/features/credit-cards/queries/use-delete-credit-card-mutation";
import CreditCardCard from "~/features/credit-cards/components/CreditCardCard.vue";
import CreditCardForm from "~/features/credit-cards/components/CreditCardForm.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
import QuickTransactionForm from "~/components/transactions/QuickTransactionForm/QuickTransactionForm.vue";
import UiEmptyState from "~/components/ui/UiEmptyState/UiEmptyState.vue";
import IllustrationCreditCardsHub from "~/components/ui/illustrations/IllustrationCreditCardsHub.vue";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();
const queryClient = useQueryClient();

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

const showModal = ref(false);
const showExpenseForm = ref(false);
const editingCard = ref<CreditCardDto | null>(null);
const deleteTarget = ref<CreditCardDto | null>(null);
const selectedCardId = ref<string | null>(null);

const submitting = computed<boolean>(
  () => createMutation.isPending.value || updateMutation.isPending.value,
);
const cards = computed<CreditCardDto[]>(() => creditCards.value ?? []);
const selectedCard = computed<CreditCardDto | null>(
  () => cards.value.find((card) => card.id === selectedCardId.value) ?? cards.value[0] ?? null,
);

watch(cards, (currentCards) => {
  if (currentCards.length === 0) {
    selectedCardId.value = null;
    return;
  }

  if (!selectedCardId.value || !currentCards.some((card) => card.id === selectedCardId.value)) {
    selectedCardId.value = currentCards[0]?.id ?? null;
  }
}, { immediate: true });

const cardsWithLimit = computed<number>(() => cards.value.filter((card) => card.limit_amount !== null).length);
const totalLimit = computed<number>(
  () => cards.value.reduce((sum, card) => sum + (card.limit_amount ?? 0), 0),
);
const benefitsCount = computed<number>(
  () => cards.value.reduce((sum, card) => sum + (card.benefits?.length ?? 0), 0),
);
const nextDueLabel = computed<string>(() => {
  const dueDay = selectedCard.value?.due_day;
  return dueDay ? `Todo dia ${dueDay}` : "Ciclo pendente";
});
const selectedLimitLabel = computed<string>(() =>
  selectedCard.value?.limit_amount !== null && selectedCard.value?.limit_amount !== undefined
    ? formatCurrency(selectedCard.value.limit_amount)
    : "Sem limite definido",
);
const selectedCycleLabel = computed<string>(() => {
  const card = selectedCard.value;
  if (!card?.closing_day || !card.due_day) {
    return "Fechamento e vencimento pendentes";
  }
  return `Fecha dia ${card.closing_day} · vence dia ${card.due_day}`;
});
const selectedBenefits = computed<readonly string[]>(() => selectedCard.value?.benefits ?? []);

/** Opens the modal in create mode. */
const openCreate = (): void => {
  editingCard.value = null;
  showModal.value = true;
};

/**
 * Opens the modal in edit mode for a given card.
 *
 * @param card Card to edit.
 */
const openEdit = (card: CreditCardDto): void => {
  editingCard.value = card;
  showModal.value = true;
};

/** Closes the modal and clears the editing target. */
const closeModal = (): void => {
  showModal.value = false;
  editingCard.value = null;
};

/**
 * Persists a created or edited card, then closes the modal.
 *
 * @param payload Card payload from the form.
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
 * Selects a card for the hub panel.
 *
 * @param card Card selected by the user.
 */
const selectCard = (card: CreditCardDto): void => {
  selectedCardId.value = card.id;
};

/**
 * Opens the delete confirmation without mutating immediately.
 *
 * @param card Card the user intends to remove.
 */
const openDeleteConfirm = (card: CreditCardDto): void => {
  deleteTarget.value = card;
};

/** Closes delete confirmation unless a deletion is already pending. */
const cancelDelete = (): void => {
  if (!deleteMutation.isPending.value) {
    deleteTarget.value = null;
  }
};

/** Deletes the confirmed card and then closes the confirmation dialog. */
const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) {
    return;
  }

  await deleteMutation.mutateAsync(deleteTarget.value.id);
  deleteTarget.value = null;
};

/** Opens the quick expense form pre-bound to the selected credit card. */
const openExpenseForm = (): void => {
  if (selectedCard.value) {
    showExpenseForm.value = true;
  }
};

/**
 * Navigates to the dedicated card detail page (bill + add expense).
 *
 * @param card Card to open.
 */
const onViewBill = (card: CreditCardDto): void => {
  void navigateTo(`/credit-cards/${card.id}`);
};

/** Refreshes card utilization after a quick expense is created. */
const onExpenseCreated = (): void => {
  void queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
};
</script>

<template>
  <div class="cc-page">
    <section class="cc-command" aria-label="Ações de cartões">
      <div class="cc-command__pulse" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div class="cc-command__actions">
        <NButton
          secondary
          size="medium"
          data-testid="cc-add-expense"
          :disabled="!selectedCard"
          @click="openExpenseForm"
        >
          <template #icon>
            <ReceiptText :size="17" />
          </template>
          Lançar despesa
        </NButton>
        <NButton type="primary" size="medium" data-testid="cc-new" @click="openCreate">
          <template #icon>
            <Plus :size="17" />
          </template>
          {{ t("pages.settings.creditCards.newCard") }}
        </NButton>
      </div>
    </section>

    <section class="cc-summary" aria-label="Resumo dos cartões">
      <article class="cc-summary__item">
        <span class="cc-summary__icon cc-summary__icon--cyan"><CreditCard :size="17" /></span>
        <span class="cc-summary__label">Cartões ativos</span>
        <strong class="cc-summary__value">{{ cards.length }}</strong>
      </article>
      <article class="cc-summary__item">
        <span class="cc-summary__icon cc-summary__icon--lime"><Landmark :size="17" /></span>
        <span class="cc-summary__label">Limite total</span>
        <strong class="cc-summary__value cc-summary__value--money">{{ formatCurrency(totalLimit) }}</strong>
        <span class="cc-summary__hint">{{ cardsWithLimit }} com limite definido</span>
      </article>
      <article class="cc-summary__item">
        <span class="cc-summary__icon cc-summary__icon--violet"><ShieldCheck :size="17" /></span>
        <span class="cc-summary__label">Benefícios mapeados</span>
        <strong class="cc-summary__value">{{ benefitsCount }}</strong>
      </article>
      <article class="cc-summary__item cc-summary__item--selected">
        <span class="cc-summary__label">Próximo vencimento</span>
        <strong class="cc-summary__value">{{ nextDueLabel }}</strong>
        <span class="cc-summary__hint">{{ selectedCard?.name ?? "Selecione um cartão" }}</span>
      </article>
    </section>

    <div v-if="isLoading" class="cc-page__loading">
      <NSpin size="large" />
    </div>

    <UiEmptyState
      v-else-if="cards.length === 0"
      title="Nenhum cartão cadastrado ainda"
      :description="t('pages.settings.creditCards.empty')"
      action-label="Novo Cartão"
      class="cc-empty"
      @action="openCreate"
    >
      <template #illustration>
        <IllustrationCreditCardsHub class="cc-empty__illustration" />
      </template>
    </UiEmptyState>

    <section v-else class="cc-workspace">
      <aside class="cc-rail" aria-label="Cartões cadastrados">
        <div class="cc-rail__header">
          <span>Carteira</span>
          <strong>{{ cards.length }}</strong>
        </div>
        <CreditCardCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :selected="card.id === selectedCard?.id"
          @select="selectCard"
          @edit="openEdit"
          @delete="openDeleteConfirm"
          @view-bill="onViewBill"
        />
      </aside>

      <section v-if="selectedCard" class="cc-focus" aria-label="Cartão selecionado">
        <section class="cc-focus__card">
          <div class="cc-focus__chrome">
            <span class="cc-focus__bank">{{ selectedCard.bank ?? "Banco não informado" }}</span>
            <span class="cc-focus__brand">{{ selectedCard.brand ?? "sem bandeira" }}</span>
          </div>
          <div class="cc-focus__identity">
            <h2>{{ selectedCard.name }}</h2>
            <span>{{ selectedCycleLabel }}</span>
          </div>
          <div class="cc-focus__footer">
            <span>Limite</span>
            <strong>{{ selectedLimitLabel }}</strong>
          </div>
        </section>

        <section class="cc-focus__panel">
          <div class="cc-focus__panel-head">
            <div>
              <span class="cc-panel__kicker">Operação rápida</span>
              <h2>Lançar despesa e acompanhar fatura</h2>
            </div>
            <NButton type="primary" data-testid="cc-add-expense-panel" @click="openExpenseForm">
              Lançar despesa
            </NButton>
          </div>

          <div class="cc-focus__metrics">
            <article>
              <span>Limite</span>
              <strong>{{ selectedLimitLabel }}</strong>
            </article>
            <article>
              <span>Ciclo</span>
              <strong>{{ selectedCycleLabel }}</strong>
            </article>
            <article>
              <span>Benefícios</span>
              <strong>{{ selectedBenefits.length || "Sem benefícios" }}</strong>
            </article>
          </div>

          <div class="cc-benefits">
            <span v-for="benefit in selectedBenefits" :key="benefit">{{ benefit }}</span>
            <span v-if="selectedBenefits.length === 0">Cadastre benefícios para comparar melhor o valor de cada cartão.</span>
          </div>

          <div class="cc-bill-context">
            <div>
              <span class="cc-panel__kicker">Fatura e transações</span>
              <p>As despesas lançadas aqui entram em Transações no mês cadastrado e atualizam a utilização do cartão.</p>
            </div>
            <div class="cc-bill-context__actions">
              <NButton secondary @click="onViewBill(selectedCard)">
                {{ t("pages.settings.creditCards.card.viewBill") }}
              </NButton>
              <NButton tertiary @click="openEdit(selectedCard)">
                {{ t("pages.settings.creditCards.edit") }}
              </NButton>
              <NButton tertiary type="error" @click="openDeleteConfirm(selectedCard)">
                {{ t("pages.settings.creditCards.remove") }}
              </NButton>
            </div>
          </div>
        </section>
      </section>
    </section>

    <AiInsightSurface class="cc-page__insights" />

    <NModal
      v-model:show="showModal"
      preset="card"
      style="max-width: 540px"
      class="cc-card-modal"
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

    <QuickTransactionForm
      v-model:visible="showExpenseForm"
      type="expense"
      :preset-credit-card-id="selectedCard?.id ?? undefined"
      @success="onExpenseCreated"
    />
  </div>
</template>

<style scoped>
.cc-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 100%;
  padding: clamp(18px, 2vw, 28px);
  color: var(--color-text-primary);
  background:
    radial-gradient(circle at 18% 4%, var(--color-brand-glow-sm), transparent 30%),
    radial-gradient(circle at 88% 8%, var(--color-info-bg), transparent 26%),
    linear-gradient(180deg, var(--color-bg-base), var(--color-bg-elevated));
}

.cc-command {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
}

.cc-command__pulse {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-brand-500);
}

.cc-command__pulse span {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: currentColor;
  box-shadow: 0 0 0 7px var(--color-brand-glow-2xs);
  animation: cc-pulse 2.2s ease-in-out infinite;
}

.cc-command__pulse span:nth-child(2) {
  color: var(--color-positive);
  animation-delay: 0.18s;
}

.cc-command__pulse span:nth-child(3) {
  color: var(--color-accent);
  animation-delay: 0.36s;
}

.cc-command__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.cc-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.cc-summary__item {
  display: grid;
  gap: 7px;
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  box-shadow: 0 16px 48px color-mix(in srgb, var(--color-neutral-950) 10%, transparent);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.cc-summary__item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-brand-500) 35%, transparent);
  box-shadow: 0 18px 60px var(--color-brand-glow-xs);
}

.cc-summary__item--selected {
  border-color: color-mix(in srgb, var(--color-brand-500) 42%, transparent);
  background:
    linear-gradient(135deg, var(--color-brand-glow-xs), var(--color-info-bg)),
    var(--color-bg-surface);
}

.cc-summary__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
}

.cc-summary__icon--cyan {
  color: var(--color-brand-500);
  background: var(--color-brand-glow-xs);
}

.cc-summary__icon--lime {
  color: var(--color-positive-dark);
  background: var(--color-positive-bg);
}

.cc-summary__icon--violet {
  color: var(--color-accent);
  background: var(--color-info-bg);
}

.cc-summary__label,
.cc-summary__hint,
.cc-panel__kicker {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.cc-summary__value {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  line-height: 1.15;
}

.cc-summary__value--money {
  font-family: "IBM Plex Mono", monospace;
  font-size: var(--font-size-lg);
}

.cc-page__loading {
  display: flex;
  justify-content: center;
  padding: 56px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 82%, transparent);
}

.cc-empty {
  padding: 42px 16px 48px;
  border: 1px dashed color-mix(in srgb, var(--color-brand-500) 34%, transparent);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 44%),
    color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
}

.cc-empty__illustration {
  width: min(260px, 72vw);
  height: auto;
  filter: drop-shadow(0 18px 42px var(--color-brand-glow-xs));
}

.cc-workspace {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.cc-rail {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.cc-rail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.cc-focus {
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(320px, 1fr);
  gap: 18px;
  min-width: 0;
}

.cc-focus__card,
.cc-focus__panel {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: 0 22px 70px color-mix(in srgb, var(--color-neutral-950) 14%, transparent);
}

.cc-focus__card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 330px;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--color-brand-glow-md), transparent 38%),
    linear-gradient(145deg, var(--color-bg-surface), var(--color-bg-elevated));
}

.cc-focus__card::after {
  position: absolute;
  right: -30px;
  bottom: -32px;
  width: 150px;
  height: 150px;
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 30%, transparent);
  border-radius: var(--radius-lg);
  content: "";
  transform: rotate(18deg);
}

.cc-focus__chrome,
.cc-focus__identity,
.cc-focus__footer,
.cc-focus__panel-head,
.cc-bill-context {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.cc-focus__bank,
.cc-focus__brand,
.cc-focus__footer span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.cc-focus__brand {
  padding: 6px 10px;
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-bg-surface) 72%, transparent);
}

.cc-focus__identity {
  align-items: flex-end;
  position: relative;
  z-index: 1;
}

.cc-focus__identity h2 {
  max-width: 70%;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  line-height: 1;
  letter-spacing: 0;
}

.cc-focus__identity span,
.cc-focus__footer strong,
.cc-focus__metrics strong {
  font-family: "IBM Plex Mono", monospace;
  color: var(--color-text-primary);
}

.cc-focus__identity span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: right;
}

.cc-focus__footer {
  align-items: flex-end;
  position: relative;
  z-index: 1;
}

.cc-focus__footer strong {
  font-size: var(--font-size-2xl);
}

.cc-focus__panel {
  display: grid;
  gap: 18px;
  padding: 22px;
  background: color-mix(in srgb, var(--color-bg-elevated) 92%, transparent);
}

.cc-focus__panel-head h2 {
  margin: 4px 0 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  line-height: 1.2;
}

.cc-focus__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.cc-focus__metrics article {
  display: grid;
  gap: 8px;
  min-height: 100px;
  padding: 14px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.cc-focus__metrics span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.cc-focus__metrics strong {
  align-self: end;
  overflow-wrap: anywhere;
  font-size: var(--font-size-sm);
  line-height: 1.25;
}

.cc-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cc-benefits span {
  padding: 8px 10px;
  border: 1px solid var(--color-positive-border);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  background: var(--color-positive-bg);
  font-size: var(--font-size-sm);
}

.cc-bill-context {
  align-items: center;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 28%, transparent);
  border-radius: var(--radius-lg);
  background: var(--color-brand-glow-2xs);
}

.cc-bill-context p {
  max-width: 620px;
  margin: 5px 0 0;
  color: var(--color-text-secondary);
}

.cc-bill-context__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.cc-bill-context__actions :deep(.n-button:not(.n-button--error-type)) {
  color: var(--color-text-secondary);
}

.cc-bill-context__actions :deep(.n-button--error-type) {
  color: var(--color-negative);
}

.cc-page__insights {
  border-radius: var(--radius-lg);
}

.cc-delete-copy {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.cc-delete-copy strong {
  color: var(--color-text-primary);
}

:global(.cc-card-modal .n-card) {
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
}

:global(.cc-card-modal .n-card__content) {
  overflow: auto;
}

@keyframes cc-pulse {
  0%,
  100% {
    transform: translateY(0) scale(0.9);
    opacity: 0.7;
  }

  50% {
    transform: translateY(-3px) scale(1.08);
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .cc-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cc-workspace,
  .cc-focus {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .cc-page {
    padding: 16px;
  }

  .cc-command,
  .cc-bill-context,
  .cc-focus__panel-head,
  .cc-focus__identity {
    flex-direction: column;
    align-items: stretch;
  }

  .cc-command__pulse {
    display: none;
  }

  .cc-command__actions {
    width: 100%;
    margin-left: 0;
  }

  .cc-command__actions :deep(.n-button),
  .cc-bill-context__actions :deep(.n-button) {
    width: 100%;
  }

  .cc-summary,
  .cc-focus__metrics {
    grid-template-columns: 1fr;
  }

  .cc-focus__identity h2 {
    max-width: 100%;
  }

  .cc-focus__identity span {
    text-align: left;
  }

  .cc-focus__card {
    min-height: 260px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cc-command__pulse span,
  .cc-summary__item {
    animation: none;
    transition: none;
  }
}
</style>
