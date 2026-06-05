<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NEmpty, NModal, NSpin } from "naive-ui";

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

const { t } = useI18n();

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

const submitting = computed<boolean>(
  () => createMutation.isPending.value || updateMutation.isPending.value,
);
const cards = computed<CreditCardDto[]>(() => creditCards.value ?? []);

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
      <NButton type="primary" size="medium" data-testid="cc-new" @click="openCreate">
        {{ t("pages.settings.creditCards.newCard") }}
      </NButton>
    </div>

    <div v-if="isLoading" class="cc-page__loading">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="cards.length === 0"
      :description="t('pages.settings.creditCards.empty')"
    />

    <section v-else class="cc-grid">
      <CreditCardCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @edit="openEdit"
        @delete="onDelete"
        @view-bill="onViewBill"
      />
    </section>

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

.cc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}
</style>
