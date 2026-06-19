<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQueryClient } from "@tanstack/vue-query";
import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  PlusCircle,
  Table2,
} from "lucide-vue-next";
import {
  NButton,
  NButtonGroup,
  NEmpty,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSpin,
  NStatistic,
  NTag,
} from "naive-ui";

import type {
  CreateCreditCardPayload,
  CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateCreditCardMutation } from "~/features/credit-cards/queries/use-create-credit-card-mutation";
import { useUpdateCreditCardMutation } from "~/features/credit-cards/queries/use-update-credit-card-mutation";
import { useDeleteCreditCardMutation } from "~/features/credit-cards/queries/use-delete-credit-card-mutation";
import CreditCardCard from "~/features/credit-cards/components/CreditCardCard.vue";
import CreditCardExpenseDrawer from "~/features/credit-cards/components/CreditCardExpenseDrawer.vue";
import CreditCardForm from "~/features/credit-cards/components/CreditCardForm.vue";
import CreditCardsTable from "~/features/credit-cards/components/CreditCardsTable.vue";
import AiInsightSurface from "~/features/ai-insights/components/AiInsightSurface.vue";
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
const editingCard = ref<CreditCardDto | null>(null);
const selectedCardId = ref<string | null>(null);
const expenseDrawerVisible = ref(false);
const expensePresetCardId = ref<string | null>(null);
const viewMode = ref<"table" | "detail" | "analytic">("table");

const submitting = computed<boolean>(
  () => createMutation.isPending.value || updateMutation.isPending.value,
);
const cards = computed<CreditCardDto[]>(() => creditCards.value ?? []);
const selectedCard = computed<CreditCardDto | null>(
  () => cards.value.find((card) => card.id === selectedCardId.value) ?? cards.value[0] ?? null,
);
const totalLimit = computed<number>(() =>
  cards.value.reduce((sum, card) => sum + (card.limit_amount ?? 0), 0),
);
const mappedBenefits = computed<number>(() =>
  cards.value.reduce((sum, card) => sum + (card.benefits?.length ?? 0), 0),
);
const nextDueCard = computed<CreditCardDto | null>(() =>
  [...cards.value]
    .filter((card) => card.due_day !== null)
    .sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99))[0]
    ?? null,
);

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
 * Deletes a card.
 *
 * @param card Card to remove.
 */
const onDelete = async (card: CreditCardDto): Promise<void> => {
  await deleteMutation.mutateAsync(card.id);
};

/**
 * Selects the contextual card used by the side panel and quick actions.
 *
 * @param card Card selected from a table row or detailed card.
 */
const selectCard = (card: CreditCardDto): void => {
  selectedCardId.value = card.id;
};

/**
 * Opens the global expense drawer, optionally preselecting a card.
 *
 * @param card Card that originated the action.
 */
const openExpenseDrawer = (card?: CreditCardDto): void => {
  expensePresetCardId.value = card?.id ?? selectedCard.value?.id ?? null;
  expenseDrawerVisible.value = true;
};

/** Invalidates all card-adjacent queries after a successful expense launch. */
const onExpenseCreated = (): void => {
  void queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
};

/**
 * Navigates to the dedicated card detail page (bill + add expense).
 *
 * @param card Card to open.
 */
const onViewBill = (card: CreditCardDto): void => {
  void navigateTo(`/credit-cards/${card.id}`);
};
</script>

<template>
  <div class="cc-page">
    <div class="cc-page__header">
      <div class="cc-page__title-block">
        <span class="cc-page__title">{{ t("pages.settings.creditCards.title") }}</span>
        <span class="cc-page__subtitle">{{ t("pages.settings.creditCards.subtitle") }}</span>
      </div>
      <NButtonGroup>
        <NButton size="medium" data-testid="cc-global-expense" @click="openExpenseDrawer()">
          <template #icon><PlusCircle :size="16" /></template>
          Lançar despesa
        </NButton>
        <NButton type="primary" size="medium" data-testid="cc-new" @click="openCreate">
          <template #icon><CreditCard :size="16" /></template>
          {{ t("pages.settings.creditCards.newCard") }}
        </NButton>
      </NButtonGroup>
    </div>

    <div v-if="isLoading" class="cc-page__loading">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="cards.length === 0"
      :description="t('pages.settings.creditCards.empty')"
    />

    <template v-else>
      <section class="cc-kpis">
        <NStatistic label="Cartões ativos">{{ cards.length }}</NStatistic>
        <NStatistic label="Limite total">{{ formatCurrency(totalLimit) }}</NStatistic>
        <NStatistic label="Benefícios mapeados">{{ mappedBenefits }}</NStatistic>
        <NStatistic label="Próximo vencimento">
          {{ nextDueCard?.due_day ? `Dia ${nextDueCard.due_day}` : "—" }}
        </NStatistic>
      </section>

      <section class="cc-workspace">
        <div class="cc-workspace__main">
          <div class="cc-toolbar">
            <NRadioGroup v-model:value="viewMode" size="small">
              <NRadioButton value="table">
                <Table2 :size="14" /> Tabela
              </NRadioButton>
              <NRadioButton value="detail">
                <LayoutGrid :size="14" /> Detalhado
              </NRadioButton>
              <NRadioButton value="analytic">
                <BarChart3 :size="14" /> Analítico
              </NRadioButton>
            </NRadioGroup>
          </div>

          <CreditCardsTable
            v-if="viewMode === 'table'"
            :cards="cards"
            :selected-card-id="selectedCard?.id"
            @select="selectCard"
            @view-dashboard="onViewBill"
            @add-expense="openExpenseDrawer"
            @edit="openEdit"
            @delete="onDelete"
          />

          <section v-else-if="viewMode === 'detail'" class="cc-grid">
            <CreditCardCard
              v-for="card in cards"
              :key="card.id"
              :card="card"
              @edit="openEdit"
              @delete="onDelete"
              @view-bill="onViewBill"
            />
          </section>

          <section v-else class="cc-analytic">
            <article>
              <span>Concentração de limite</span>
              <strong>{{ selectedCard ? formatCurrency(selectedCard.limit_amount ?? 0) : "—" }}</strong>
              <small>Cartão selecionado comparado ao limite total.</small>
            </article>
            <article>
              <span>Ciclos sem configuração</span>
              <strong>{{ cards.filter((card) => card.closing_day === null || card.due_day === null).length }}</strong>
              <small>Cartões sem fechamento/vencimento impedem análise de fatura.</small>
            </article>
            <article>
              <span>Benefícios por cartão</span>
              <strong>{{ cards.length ? (mappedBenefits / cards.length).toFixed(1) : "0" }}</strong>
              <small>Ajuda a comparar cartões além do limite nominal.</small>
            </article>
          </section>
        </div>

        <aside class="cc-context">
          <p class="cc-context__eyebrow">Cartão selecionado</p>
          <template v-if="selectedCard">
            <h2>{{ selectedCard.name }}</h2>
            <p>{{ selectedCard.bank ?? "Banco não informado" }}</p>
            <div class="cc-context__facts">
              <span>Limite</span>
              <strong>{{ selectedCard.limit_amount !== null ? formatCurrency(selectedCard.limit_amount) : "—" }}</strong>
              <span>Ciclo</span>
              <strong>
                {{ selectedCard.closing_day && selectedCard.due_day ? `Fecha ${selectedCard.closing_day} · vence ${selectedCard.due_day}` : "Incompleto" }}
              </strong>
              <span>Benefícios</span>
              <strong>{{ selectedCard.benefits?.length ?? 0 }}</strong>
            </div>
            <div class="cc-context__actions">
              <NButton type="primary" block @click="openExpenseDrawer(selectedCard)">
                Lançar despesa
              </NButton>
              <NButton block @click="onViewBill(selectedCard)">Abrir dashboard</NButton>
              <NButton block tertiary @click="openEdit(selectedCard)">Editar cartão</NButton>
            </div>
            <div class="cc-context__tags">
              <NTag
                v-for="benefit in selectedCard.benefits ?? []"
                :key="benefit"
                size="small"
                type="success"
                :bordered="false"
              >
                {{ benefit }}
              </NTag>
            </div>
          </template>
        </aside>
      </section>
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

    <CreditCardExpenseDrawer
      v-model:visible="expenseDrawerVisible"
      :preset-credit-card-id="expensePresetCardId"
      @success="onExpenseCreated"
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

.cc-page__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}

.cc-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.cc-kpis :deep(.n-statistic) {
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-3);
  align-items: start;
}

.cc-workspace__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.cc-toolbar {
  display: flex;
  justify-content: flex-end;
}

.cc-toolbar :deep(.n-radio-button__label) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

.cc-analytic {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.cc-analytic article,
.cc-context {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-analytic article {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 150px;
  padding: var(--space-3);
}

.cc-analytic span,
.cc-analytic small,
.cc-context p,
.cc-context__eyebrow,
.cc-context__facts span {
  color: var(--color-text-secondary);
}

.cc-analytic strong {
  font-size: var(--font-size-lg);
}

.cc-context {
  position: sticky;
  top: var(--space-3);
  padding: var(--space-3);
}

.cc-context h2,
.cc-context p {
  margin: 0;
}

.cc-context__eyebrow {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.cc-context__facts {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-2);
  margin: var(--space-3) 0;
}

.cc-context__actions {
  display: grid;
  gap: var(--space-1);
}

.cc-context__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

@media (max-width: 1080px) {
  .cc-workspace,
  .cc-analytic {
    grid-template-columns: 1fr;
  }

  .cc-context {
    position: static;
  }
}

@media (max-width: 760px) {
  .cc-page__header {
    align-items: stretch;
    flex-direction: column;
  }

  .cc-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .cc-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
