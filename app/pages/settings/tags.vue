<script setup lang="ts">
import { h, type VNodeChild } from "vue";
import {
  NButton,
  NCard,
  NColorPicker,
  NDataTable,
  NFormItem,
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
import { stripHexAlpha } from "~/features/tags/utils/normalize-color";

const { t } = useI18n();

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
const formColor = ref<string>("");
const formIcon = ref<string>("");

/**
 *
 */
function openCreate(): void {
  editingTag.value = null;
  formName.value = "";
  formColor.value = "";
  formIcon.value = "";
  showModal.value = true;
}

/**
 *
 * @param tag
 */
function openEdit(tag: TagDto): void {
  editingTag.value = tag;
  formName.value = tag.name;
  formColor.value = tag.color ?? "";
  formIcon.value = tag.icon ?? "";
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  formColor.value = "";
  formIcon.value = "";
  editingTag.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  const color = stripHexAlpha(formColor.value.trim() || null);
  const icon = formIcon.value.trim() || null;

  if (editingTag.value) {
    await updateMutation.mutateAsync({ id: editingTag.value.id, name, color, icon });
  } else {
    await createMutation.mutateAsync({ name, color, icon });
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
    title: t("pages.settings.tags.columns.color"),
    key: "color",
    width: 80,
    render(row: TagDto): VNodeChild {
      if (!row.color) {return "—";}
      return h("span", {
        style: {
          display: "inline-block",
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          background: row.color,
          border: "1px solid rgba(0,0,0,0.15)",
          verticalAlign: "middle",
        },
        title: row.color,
      });
    },
  },
  {
    title: t("pages.settings.tags.columns.icon"),
    key: "icon",
    width: 60,
    render(row: TagDto): VNodeChild {
      return row.icon ?? "—";
    },
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
      <div class="modal-form">
        <NFormItem :label="$t('pages.settings.tags.placeholder')">
          <NInput
            v-model:value="formName"
            :placeholder="$t('pages.settings.tags.placeholder')"
            maxlength="50"
            show-count
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.tags.fields.color')">
          <NColorPicker
            v-model:value="formColor"
            :swatches="['#FF6B6B','#E67E22','#F1C40F','#2ECC71','#4ECDC4','#3498DB','#9B59B6','#DDA0DD','#96CEB4','#D3D3D3']"
            :modes="['hex']"
            :show-alpha="false"
            size="small"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.tags.fields.icon')">
          <NInput
            v-model:value="formIcon"
            :placeholder="$t('pages.settings.tags.fields.iconPlaceholder')"
            maxlength="10"
          />
        </NFormItem>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
@import "~/assets/css/settings.css";

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-2);
}

.color-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.color-field .n-input {
  flex: 1;
}

.color-preview {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  flex-shrink: 0;
}
</style>
