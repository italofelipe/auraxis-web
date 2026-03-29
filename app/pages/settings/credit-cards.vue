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

definePageMeta({
  middleware: ["authenticated"],
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

const columns: DataTableColumns<CreditCardDto> = [
  {
    title: "Nome",
    key: "name",
  },
  {
    title: "Ações",
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
          () => "Editar",
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => confirmDelete(row.id),
          },
          {
            default: () => "Confirma remoção deste cartão?",
            trigger: () =>
              h(
                NButton,
                { size: "small", type: "error" },
                () => "Remover",
              ),
          },
        ),
      ]);
    },
  },
];
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">Cartões de Crédito</span>
        <span class="settings-page__subtitle">Gerencie seus cartões de crédito</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">Novo Cartão</NButton>
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
      :title="editingCard ? 'Editar Cartão' : 'Novo Cartão'"
      :positive-text="editingCard ? 'Salvar' : 'Criar'"
      negative-text="Cancelar"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <NInput
        v-model:value="formName"
        placeholder="Nome do cartão"
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
