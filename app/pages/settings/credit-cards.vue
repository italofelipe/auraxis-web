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
  pageTitle: "Cartões de Crédito",
  pageSubtitle: "Gerencie seus cartões de crédito",
});

useHead({ title: "Cartões de Crédito | Auraxis" });

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

/**
 *
 */
const openCreate = (): void => {
  editingCard.value = null;
  showModal.value = true;
};

/**
 *
 * @param card
 */
const openEdit = (card: CreditCardDto): void => {
  editingCard.value = card;
  showModal.value = true;
};

/**
 *
 */
const closeModal = (): void => {
  showModal.value = false;
  editingCard.value = null;
};

/**
 *
 * @param payload
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
 *
 * @param card
 */
const onDelete = async (card: CreditCardDto): Promise<void> => {
  await deleteMutation.mutateAsync(card.id);
};

/**
 *
 * @param card
 */
const onViewBill = (card: CreditCardDto): void => {
  void navigateTo(`/settings/credit-cards/${card.id}/bill`);
};
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">{{ t("pages.settings.creditCards.title") }}</span>
        <span class="settings-page__subtitle">{{ t("pages.settings.creditCards.subtitle") }}</span>
      </div>
      <NButton type="primary" size="medium" data-testid="cc-new" @click="openCreate">
        {{ t("pages.settings.creditCards.newCard") }}
      </NButton>
    </div>

    <div v-if="isLoading" class="settings-page__loading">
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

    <AiInsightSurface class="settings-page__insights" />

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
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.settings-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.settings-page__title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.settings-page__subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.75;
}

.settings-page__loading {
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
