<script setup lang="ts">
import { h, type VNodeChild } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NSpin,
  type DataTableColumns,
} from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateCreditCardMutation } from "~/features/credit-cards/queries/use-create-credit-card-mutation";
import { useUpdateCreditCardMutation } from "~/features/credit-cards/queries/use-update-credit-card-mutation";
import { useDeleteCreditCardMutation } from "~/features/credit-cards/queries/use-delete-credit-card-mutation";

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
const formName = ref("");

/**
 *
 */
function openCreate(): void {
  editingCard.value = null;
  formName.value = "";
  showModal.value = true;
}

/**
 *
 * @param card
 */
function openEdit(card: CreditCardDto): void {
  editingCard.value = card;
  formName.value = card.name;
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  editingCard.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  if (editingCard.value) {
    await updateMutation.mutateAsync({ id: editingCard.value.id, name });
  } else {
    await createMutation.mutateAsync({ name });
  }

  closeModal();
}

/**
 *
 * @param id
 */
async function confirmDelete(id: string): Promise<void> {
  await deleteMutation.mutateAsync(id);
}

const columns = computed((): DataTableColumns<CreditCardDto> => [
  {
    title: t("pages.settings.creditCards.columns.name"),
    key: "name",
  },
  {
    title: t("pages.settings.creditCards.columns.actions"),
    key: "actions",
    width: 160,
    render(row: CreditCardDto): VNodeChild {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          {
            size: "small",
            onClick: () => openEdit(row),
          },
          () => t("pages.settings.creditCards.edit"),
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => confirmDelete(row.id),
          },
          {
            default: () => t("pages.settings.creditCards.confirmDelete"),
            trigger: () =>
              h(
                NButton,
                { size: "small", type: "error" },
                () => t("pages.settings.creditCards.remove"),
              ),
          },
        ),
      ]);
    },
  },
]);
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">{{ $t('pages.settings.creditCards.title') }}</span>
        <span class="settings-page__subtitle">{{ $t('pages.settings.creditCards.subtitle') }}</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">{{ $t('pages.settings.creditCards.newCard') }}</NButton>
    </div>

    <NCard>
      <NSpin v-if="isLoading" />
      <NDataTable
        v-else
        :columns="columns"
        :data="creditCards ?? []"
        :pagination="{ pageSize: 20 }"
        :bordered="false"
        size="small"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="editingCard ? $t('pages.settings.creditCards.editCard') : $t('pages.settings.creditCards.newCard')"
      :positive-text="editingCard ? $t('pages.settings.creditCards.save') : $t('pages.settings.creditCards.create')"
      :negative-text="$t('pages.settings.creditCards.cancel')"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <NInput
        v-model:value="formName"
        :placeholder="$t('pages.settings.creditCards.placeholder')"
        maxlength="100"
        show-count
      />
    </NModal>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.settings-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.settings-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.settings-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
