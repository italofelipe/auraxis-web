<script setup lang="ts">
import {
  NButton,
  NColorPicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
} from "naive-ui";
import { useCreateTagMutation } from "~/features/tags/queries/use-create-tag-mutation";
import { stripHexAlpha } from "~/features/tags/utils/normalize-color";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const createMutation = useCreateTagMutation();

const formName = ref("");
const formColor = ref<string | null>(null);
const formIcon = ref("");

const TAG_COLOR_SWATCHES = [
  "#FF6B6B",
  "#E67E22",
  "#F1C40F",
  "#2ECC71",
  "#4ECDC4",
  "#3498DB",
  "#9B59B6",
  "#DDA0DD",
  "#96CEB4",
  "#D3D3D3",
];

/** Resets the form to its initial state. */
function resetForm(): void {
  formName.value = "";
  formColor.value = null;
  formIcon.value = "";
}

/** Closes the modal. */
function close(): void {
  emit("update:visible", false);
  resetForm();
}

/** Submits the tag creation. */
async function onSubmit(): Promise<void> {
  const name = formName.value.trim();
  if (!name) { return; }

  await createMutation.mutateAsync({
    name,
    color: stripHexAlpha(formColor.value),
    icon: formIcon.value.trim() || null,
  });

  close();
}
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="t('transactions.tagModal.title')"
    class="create-tag-modal"
    :mask-closable="true"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NForm label-placement="top">
      <NFormItem :label="t('transactions.tagModal.name')">
        <NInput
          v-model:value="formName"
          :placeholder="t('transactions.tagModal.namePlaceholder')"
          maxlength="50"
          show-count
        />
      </NFormItem>

      <NFormItem :label="t('transactions.tagModal.color')">
        <div class="create-tag-modal__color-section">
          <NColorPicker
            v-model:value="formColor"
            :swatches="TAG_COLOR_SWATCHES"
            :modes="['hex']"
            :show-alpha="false"
            size="small"
          />
          <div v-if="formColor" class="create-tag-modal__preview">
            <span
              class="create-tag-modal__preview-badge"
              :style="{
                backgroundColor: `${formColor}20`,
                border: `1px solid ${formColor}`,
                color: formColor,
              }"
            >
              {{ formName || t('transactions.tagModal.previewLabel') }}
            </span>
          </div>
        </div>
      </NFormItem>

      <NFormItem :label="t('transactions.tagModal.icon')">
        <NInput
          v-model:value="formIcon"
          :placeholder="t('transactions.tagModal.iconPlaceholder')"
          maxlength="10"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">{{ t('common.cancel') }}</NButton>
        <NButton
          type="primary"
          :loading="createMutation.isPending.value"
          :disabled="!formName.trim()"
          @click="onSubmit"
        >
          {{ t('transactions.tagModal.create') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.create-tag-modal {
  width: min(420px, 95vw);
}

.create-tag-modal__color-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.create-tag-modal__preview {
  padding: var(--space-1) 0;
}

.create-tag-modal__preview-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium, 500);
  line-height: 1.5;
}
</style>
