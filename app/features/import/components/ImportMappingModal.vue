<script setup lang="ts">
import { NButton, NModal, NSelect, NTag, NText } from "naive-ui";

import type { ImportMappingFieldViewModel } from "~/features/import/composables/useImportWizard";
import type { ImportMappingFieldKey } from "~/features/import/model/import";

const props = defineProps<{
  show: boolean;
  fields: readonly ImportMappingFieldViewModel[];
  headers: readonly string[];
  busy: boolean;
}>();

const emit = defineEmits<{
  change: [field: ImportMappingFieldKey, value: string];
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();

/**
 * Opções do select — as próprias colunas do arquivo.
 *
 * @returns Opções no formato do Naive UI.
 */
const headerOptions = computed(() =>
  props.headers.map((header) => ({ label: header, value: header })),
);

/**
 * Rótulo humano do campo do mapeamento.
 *
 * @param key Campo do mapeamento.
 * @returns Texto traduzido.
 */
const fieldLabel = (key: ImportMappingFieldKey): string =>
  t(`import.mapping.fields.${key}`);
</script>

<template>
  <!--
    Largura vai no `style` do próprio NModal: o card é teleportado para o body e
    regra de `<style scoped>` não o alcança (ver 26_frontend_architecture).
  -->
  <NModal
    :show="props.show"
    preset="card"
    :title="t('import.mapping.title')"
    style="width: min(560px, 95vw)"
    :mask-closable="false"
    :aria-label="t('import.mapping.title')"
    @update:show="(value: boolean) => !value && emit('cancel')"
  >
    <div class="import-mapping">
      <NText depth="3">{{ t("import.mapping.description") }}</NText>

      <div
        v-for="field in props.fields"
        :key="field.key"
        class="import-mapping__field"
      >
        <div class="import-mapping__header">
          <NText strong>{{ fieldLabel(field.key) }}</NText>
          <NTag size="small" :bordered="false">
            {{ t("import.mapping.confidence", { value: Math.round(field.confidence * 100) }) }}
          </NTag>
        </div>

        <NSelect
          :value="field.value || null"
          :options="headerOptions"
          :placeholder="t('import.mapping.placeholder')"
          :aria-label="fieldLabel(field.key)"
          :data-testid="`import-mapping-${field.key}`"
          @update:value="(value: string) => emit('change', field.key, value)"
        />

        <div v-if="field.sampleValues.length > 0" class="import-mapping__samples">
          <NText depth="3">{{ t("import.mapping.samples") }}</NText>
          <NText v-for="sample in field.sampleValues" :key="sample" depth="2">
            • {{ sample }}
          </NText>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="import-mapping__actions">
        <NButton quaternary @click="emit('cancel')">
          {{ t("common.cancel") }}
        </NButton>
        <NButton
          type="primary"
          :loading="props.busy"
          :disabled="props.busy"
          data-testid="import-mapping-confirm"
          @click="emit('confirm')"
        >
          {{ t("import.mapping.confirm") }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.import-mapping {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.import-mapping__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.import-mapping__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.import-mapping__samples {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-size-xs);
}

.import-mapping__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
