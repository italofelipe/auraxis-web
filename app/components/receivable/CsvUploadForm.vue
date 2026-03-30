<script setup lang="ts">
import { NButton, NCard, NInput, NSpace } from "naive-ui";
import { ref } from "vue";

import type { CsvUploadPayload } from "~/features/receivables/services/receivables.client";

interface Emits {
  /** Emitted with the assembled upload payload when the user requests a preview. */
  (e: "preview", payload: CsvUploadPayload): void;
}


const emit = defineEmits<Emits>();

const fileContent = ref<string>("");
const mapDescription = ref<string>("");
const mapAmount = ref<string>("");
const mapDate = ref<string>("");
const mapCategory = ref<string>("");

/**
 * Reads the selected CSV file as plain text and stores it in `fileContent`.
 *
 * @param event Input change event from the file input element.
 */
const handleFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) { return; }

  const reader = new FileReader();
  reader.onload = (e): void => {
    fileContent.value = (e.target?.result as string) ?? "";
  };
  reader.readAsText(file);
};

/**
 * Assembles the upload payload from the current form state and emits the
 * `preview` event so the parent can call the upload mutation.
 */
const handlePreview = (): void => {
  const column_map: Record<string, string> = {};

  if (mapDescription.value) { column_map[mapDescription.value] = "description"; }
  if (mapAmount.value) { column_map[mapAmount.value] = "amount"; }
  if (mapDate.value) { column_map[mapDate.value] = "date"; }
  if (mapCategory.value) { column_map[mapCategory.value] = "category"; }

  emit("preview", {
    content: fileContent.value,
    column_map,
  });
};

const isPreviewDisabled = computed((): boolean => {
  return !fileContent.value;
});

defineExpose({ fileContent });
</script>

<template>
  <NCard class="csv-upload-form" :title="$t('receivable.csv.title')">
    <NSpace vertical :size="16">
      <div class="csv-upload-form__field">
        <label class="csv-upload-form__label" for="csv-file-input">
          {{ $t('receivable.csv.fileLabel') }}
        </label>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          class="csv-upload-form__file-input"
          @change="handleFileChange"
        >
      </div>

      <p class="csv-upload-form__hint">
        {{ $t('receivable.csv.mappingHint') }}
      </p>

      <NSpace :size="12" class="csv-upload-form__mapping">
        <div class="csv-upload-form__mapping-field">
          <label class="csv-upload-form__label">{{ $t('receivable.csv.fields.description') }}</label>
          <NInput
            v-model:value="mapDescription"
            :placeholder="$t('receivable.csv.placeholders.description')"
            size="small"
          />
        </div>

        <div class="csv-upload-form__mapping-field">
          <label class="csv-upload-form__label">{{ $t('receivable.csv.fields.amount') }}</label>
          <NInput
            v-model:value="mapAmount"
            :placeholder="$t('receivable.csv.placeholders.amount')"
            size="small"
          />
        </div>

        <div class="csv-upload-form__mapping-field">
          <label class="csv-upload-form__label">{{ $t('receivable.csv.fields.date') }}</label>
          <NInput
            v-model:value="mapDate"
            :placeholder="$t('receivable.csv.placeholders.date')"
            size="small"
          />
        </div>

        <div class="csv-upload-form__mapping-field">
          <label class="csv-upload-form__label">{{ $t('receivable.csv.fields.category') }}</label>
          <NInput
            v-model:value="mapCategory"
            :placeholder="$t('receivable.csv.placeholders.category')"
            size="small"
          />
        </div>
      </NSpace>

      <NSpace justify="end">
        <NButton
          type="primary"
          :disabled="isPreviewDisabled"
          @click="handlePreview"
        >
          {{ $t('receivable.csv.preview') }}
        </NButton>
      </NSpace>
    </NSpace>
  </NCard>
</template>

<style scoped>
.csv-upload-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.csv-upload-form__label {
  font-size: var(--font-size-body-sm, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-subtle, #888);
}

.csv-upload-form__file-input {
  font-size: var(--font-size-body-sm, 0.75rem);
}

.csv-upload-form__hint {
  margin: 0;
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
}

.csv-upload-form__mapping {
  flex-wrap: wrap;
}

.csv-upload-form__mapping-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
  min-width: 140px;
  flex: 1 1 140px;
}
</style>
