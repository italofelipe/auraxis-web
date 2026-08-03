<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton, NText } from "naive-ui";
import { UploadCloud } from "lucide-vue-next";

import {
  IMPORT_ACCEPTED_EXTENSIONS,
  IMPORT_MAX_FILE_BYTES,
} from "~/features/import/model/import";

const props = defineProps<{
  /** Bloqueia a seleção enquanto uma chamada está em andamento. */
  disabled?: boolean;
  /** Extensões aceitas. Default: as da planilha (`.csv`, `.xlsx`). */
  extensions?: readonly string[];
  /** Copy do título. Default: a da planilha. */
  title?: string;
  /** Copy da linha de apoio. Default: a da planilha. */
  hint?: string;
  /** Mensagem de extensão inválida. Default: a da planilha. */
  invalidTypeMessage?: string;
  /** Rótulo acessível do campo de arquivo. Default: o da planilha. */
  ariaLabel?: string;
}>();

const emit = defineEmits<{ select: [file: File] }>();

const { t } = useI18n();
const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const localError = ref<string | null>(null);

const extensions = computed(
  (): readonly string[] => props.extensions ?? IMPORT_ACCEPTED_EXTENSIONS,
);
const accept = computed((): string => extensions.value.join(","));
const title = computed((): string => props.title ?? t("import.dropzone.title"));
const hint = computed((): string => props.hint ?? t("import.dropzone.hint"));
const ariaLabel = computed(
  (): string => props.ariaLabel ?? t("import.dropzone.ariaLabel"),
);

/**
 * Valida extensão e tamanho antes de subir. O backend responde 415/413 nesses
 * casos, mas errar localmente evita uma ida ao servidor e uma mensagem crua.
 *
 * @param file Arquivo escolhido.
 * @returns Mensagem de erro, ou null quando o arquivo serve.
 */
const validate = (file: File): string | null => {
  const name = file.name.toLowerCase();
  const hasValidExtension = extensions.value.some((extension) =>
    name.endsWith(extension),
  );

  if (!hasValidExtension) {
    return props.invalidTypeMessage ?? t("import.dropzone.invalidType");
  }

  if (file.size > IMPORT_MAX_FILE_BYTES) {
    return t("import.dropzone.tooLarge");
  }

  return null;
};

/**
 * Encaminha o arquivo escolhido quando ele passa na validação local.
 *
 * @param file Arquivo candidato.
 */
const handleFile = (file: File | undefined): void => {
  if (!file) {
    return;
  }

  const validationError = validate(file);
  localError.value = validationError;

  if (!validationError) {
    emit("select", file);
  }
};

/** Abre o seletor nativo de arquivos. */
const openPicker = (): void => {
  inputRef.value?.click();
};

/**
 * Lê o arquivo escolhido no input nativo.
 *
 * @param event Evento de mudança do input.
 */
const onInputChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  handleFile(input.files?.[0]);
  input.value = "";
};

/**
 * Aceita o arquivo solto na área de drop.
 *
 * @param event Evento de drop.
 */
const onDrop = (event: DragEvent): void => {
  isDragging.value = false;
  handleFile(event.dataTransfer?.files?.[0]);
};
</script>

<template>
  <div class="import-dropzone">
    <div
      class="import-dropzone__area"
      :class="{ 'import-dropzone__area--active': isDragging }"
      role="button"
      tabindex="0"
      :aria-label="ariaLabel"
      :aria-disabled="props.disabled ? 'true' : 'false'"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <UploadCloud :size="32" aria-hidden="true" />
      <NText strong>{{ title }}</NText>
      <NText depth="3">{{ hint }}</NText>
      <NButton
        type="primary"
        :disabled="props.disabled"
        :loading="props.disabled"
        data-testid="import-pick-file"
        @click.stop="openPicker"
      >
        {{ t("import.dropzone.action") }}
      </NButton>
    </div>

    <input
      ref="inputRef"
      type="file"
      class="import-dropzone__input"
      :accept="accept"
      :aria-label="ariaLabel"
      data-testid="import-file-input"
      @change="onInputChange"
    >

    <NText v-if="localError" type="error" data-testid="import-dropzone-error">
      {{ localError }}
    </NText>
  </div>
</template>

<style scoped>
.import-dropzone {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.import-dropzone__area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px dashed var(--color-outline-soft);
  border-radius: var(--radius-lg);
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--motion-fast),
    background-color var(--motion-fast);
}

.import-dropzone__area:hover,
.import-dropzone__area:focus-visible,
.import-dropzone__area--active {
  border-color: var(--color-brand-500);
  background-color: var(--color-bg-elevated);
}

.import-dropzone__input {
  display: none;
}
</style>
