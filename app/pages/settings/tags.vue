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

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
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

const columns = computed((): DataTableColumns<TagDto> => [
  {
    title: t("pages.settings.tags.columns.name"),
    key: "name",
  },
  {
    title: t("pages.settings.tags.columns.actions"),
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
          () => t("pages.settings.tags.edit"),
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => confirmDelete(row.id),
          },
          {
            default: () => t("pages.settings.tags.confirmDelete"),
            trigger: () =>
              h(
                NButton,
                { size: "small", type: "error" },
                () => t("pages.settings.tags.remove"),
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
        <span class="settings-page__title">{{ $t('pages.settings.tags.title') }}</span>
        <span class="settings-page__subtitle">{{ $t('pages.settings.tags.subtitle') }}</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">{{ $t('pages.settings.tags.newTag') }}</NButton>
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
      :title="editingTag ? $t('pages.settings.tags.editTag') : $t('pages.settings.tags.newTag')"
      :positive-text="editingTag ? $t('pages.settings.tags.save') : $t('pages.settings.tags.create')"
      :negative-text="$t('pages.settings.tags.cancel')"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <NInput
        v-model:value="formName"
        :placeholder="$t('pages.settings.tags.placeholder')"
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
