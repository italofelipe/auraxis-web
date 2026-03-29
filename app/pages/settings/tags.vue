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

import type { TagDto } from "~/features/tags/contracts/tag.dto";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useCreateTagMutation } from "~/features/tags/queries/use-create-tag-mutation";
import { useUpdateTagMutation } from "~/features/tags/queries/use-update-tag-mutation";
import { useDeleteTagMutation } from "~/features/tags/queries/use-delete-tag-mutation";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Tags",
  pageSubtitle: "Gerencie suas tags de categorização",
});

useHead({ title: "Tags | Auraxis" });

const { data: tags, isLoading } = useTagsQuery();
const createMutation = useCreateTagMutation();
const updateMutation = useUpdateTagMutation();
const deleteMutation = useDeleteTagMutation();

const showModal = ref(false);
const editingTag = ref<TagDto | null>(null);
const formName = ref("");

/**
 *
 */
function openCreate(): void {
  editingTag.value = null;
  formName.value = "";
  showModal.value = true;
}

/**
 *
 * @param tag
 */
function openEdit(tag: TagDto): void {
  editingTag.value = tag;
  formName.value = tag.name;
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  editingTag.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  if (editingTag.value) {
    await updateMutation.mutateAsync({ id: editingTag.value.id, name });
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

const columns: DataTableColumns<TagDto> = [
  {
    title: "Nome",
    key: "name",
  },
  {
    title: "Ações",
    key: "actions",
    width: 160,
    render(row: TagDto): VNodeChild {
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
            default: () => "Confirma remoção desta tag?",
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
        <span class="settings-page__title">Tags</span>
        <span class="settings-page__subtitle">Gerencie suas tags de categorização</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">Nova Tag</NButton>
    </div>

    <NCard>
      <NSpin v-if="isLoading" />
      <NDataTable
        v-else
        :columns="columns"
        :data="tags ?? []"
        :pagination="{ pageSize: 20 }"
        :bordered="false"
        size="small"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="editingTag ? 'Editar Tag' : 'Nova Tag'"
      :positive-text="editingTag ? 'Salvar' : 'Criar'"
      negative-text="Cancelar"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <NInput
        v-model:value="formName"
        placeholder="Nome da tag"
        maxlength="50"
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
