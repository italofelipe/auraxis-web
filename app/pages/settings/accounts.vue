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

import type { AccountDto } from "~/features/accounts/contracts/account.dto";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreateAccountMutation } from "~/features/accounts/queries/use-create-account-mutation";
import { useUpdateAccountMutation } from "~/features/accounts/queries/use-update-account-mutation";
import { useDeleteAccountMutation } from "~/features/accounts/queries/use-delete-account-mutation";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Contas",
  pageSubtitle: "Gerencie suas contas bancárias",
});

useHead({ title: "Contas | Auraxis" });

const { data: accounts, isLoading } = useAccountsQuery();
const createMutation = useCreateAccountMutation();
const updateMutation = useUpdateAccountMutation();
const deleteMutation = useDeleteAccountMutation();

const showModal = ref(false);
const editingAccount = ref<AccountDto | null>(null);
const formName = ref("");

/**
 *
 */
function openCreate(): void {
  editingAccount.value = null;
  formName.value = "";
  showModal.value = true;
}

/**
 *
 * @param account
 */
function openEdit(account: AccountDto): void {
  editingAccount.value = account;
  formName.value = account.name;
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  editingAccount.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  if (editingAccount.value) {
    await updateMutation.mutateAsync({ id: editingAccount.value.id, name });
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

const columns: DataTableColumns<AccountDto> = [
  {
    title: "Nome",
    key: "name",
  },
  {
    title: "Ações",
    key: "actions",
    width: 160,
    render(row: AccountDto): VNodeChild {
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
            default: () => "Confirma remoção desta conta?",
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
        <span class="settings-page__title">Contas</span>
        <span class="settings-page__subtitle">Gerencie suas contas bancárias</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">Nova Conta</NButton>
    </div>

    <NCard>
      <NSpin v-if="isLoading" />
      <NDataTable
        v-else
        :columns="columns"
        :data="accounts ?? []"
        :pagination="{ pageSize: 20 }"
        :bordered="false"
        size="small"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="editingAccount ? 'Editar Conta' : 'Nova Conta'"
      :positive-text="editingAccount ? 'Salvar' : 'Criar'"
      negative-text="Cancelar"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <NInput
        v-model:value="formName"
        placeholder="Nome da conta"
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
