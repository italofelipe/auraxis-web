<script setup lang="ts">
import { computed } from "vue";
import { NAlert, NButton, NCard, NTag, NText } from "naive-ui";

import BankImportBankPicker from "~/features/import/components/BankImportBankPicker.vue";
import BankImportPreviewTable from "~/features/import/components/BankImportPreviewTable.vue";
import ImportDropzone from "~/features/import/components/ImportDropzone.vue";
import ImportResult from "~/features/import/components/ImportResult.vue";
import ImportUpsellBanner from "~/features/import/components/ImportUpsellBanner.vue";
import { useBankImportWizard } from "~/features/import/composables/useBankImportWizard";
import { BANK_IMPORT_ACCEPTED_EXTENSIONS } from "~/features/import/model/bank-import";

const emit = defineEmits<{ "go-to-transactions": []; upgrade: [] }>();

const { t } = useI18n();
const wizard = useBankImportWizard();

const extensions = computed(
  (): readonly string[] => [...BANK_IMPORT_ACCEPTED_EXTENSIONS],
);
const fileName = computed((): string => wizard.file.value?.name ?? "");
</script>

<template>
  <div class="bank-import">
    <ImportUpsellBanner
      v-if="wizard.isUpsell.value"
      @upgrade="emit('upgrade')"
      @dismiss="wizard.dismissError"
    />

    <!--
      422/415 é arquivo que não dá para ler. O mapeamento do wizard de planilha
      trata 422 como "prévia expirou" e não serve aqui: copiá-lo mandaria o
      usuário reenviar um arquivo quebrado em loop.
    -->
    <NAlert
      v-else-if="wizard.isFileUnreadable.value"
      type="error"
      :title="t('import.bank.errors.unreadableTitle')"
      data-testid="bank-import-unreadable"
    >
      <p>{{ t("import.bank.errors.unreadableDescription") }}</p>
      <NButton size="small" @click="wizard.reset">
        {{ t("import.bank.errors.pickAnother") }}
      </NButton>
    </NAlert>

    <NAlert
      v-else-if="wizard.isPreviewExpired.value"
      type="warning"
      :title="t('import.bank.errors.expiredTitle')"
      data-testid="bank-import-expired"
    >
      <p>{{ t("import.bank.errors.expiredDescription") }}</p>
      <NButton size="small" @click="wizard.reset">
        {{ t("import.bank.errors.restart") }}
      </NButton>
    </NAlert>

    <!-- 409: UNIQUE(session_id) no confirm — outra aba já gravou este extrato. -->
    <NAlert
      v-else-if="wizard.isAlreadyConfirmed.value"
      type="info"
      :title="t('import.bank.errors.alreadyConfirmedTitle')"
      data-testid="bank-import-already-confirmed"
    >
      <p>{{ t("import.bank.errors.alreadyConfirmedDescription") }}</p>
      <NButton size="small" @click="emit('go-to-transactions')">
        {{ t("import.success.goToTransactions") }}
      </NButton>
    </NAlert>

    <NAlert
      v-else-if="wizard.error.value"
      type="error"
      closable
      :title="t('import.bank.errors.genericTitle')"
      data-testid="bank-import-error"
      @close="wizard.dismissError"
    >
      {{ t("import.bank.errors.genericDescription") }}
    </NAlert>

    <NCard v-if="wizard.step.value === 'select'" :title="t('import.bank.select.title')">
      <NText depth="3">{{ t("import.bank.select.description") }}</NText>
      <ImportDropzone
        :disabled="wizard.isBusy.value"
        :extensions="extensions"
        :title="t('import.bank.dropzone.title')"
        :hint="t('import.bank.dropzone.hint')"
        :invalid-type-message="t('import.bank.dropzone.invalidType')"
        :aria-label="t('import.bank.dropzone.ariaLabel')"
        @select="(file: File) => wizard.selectFile(file)"
      />
    </NCard>

    <NCard
      v-else-if="wizard.step.value === 'bank'"
      :title="t('import.bank.pick.title')"
    >
      <BankImportBankPicker
        :model-value="wizard.bankId.value"
        :file-name="fileName"
        :can-confirm="wizard.canConfirmBank.value"
        :busy="wizard.isBusy.value"
        @update:model-value="wizard.setBank"
        @confirm="wizard.confirmBank"
        @cancel="wizard.cancelBank"
      />
    </NCard>

    <template v-else-if="wizard.step.value === 'preview'">
      <NCard :title="t('import.bank.preview.title')">
        <div class="bank-import__summary">
          <NText strong data-testid="bank-import-preview-summary">
            {{ t("import.preview.summary", {
              selected: wizard.selectedCount.value,
              total: wizard.totalCount.value,
            }) }}
          </NText>
          <NTag v-if="wizard.duplicateCount.value > 0" type="warning" :bordered="false">
            {{ t("import.preview.duplicates", wizard.duplicateCount.value) }}
          </NTag>
        </div>

        <div class="bank-import__actions">
          <NButton
            quaternary
            data-testid="bank-import-start-over"
            @click="wizard.reset"
          >
            {{ t("import.preview.startOver") }}
          </NButton>
          <NButton
            type="primary"
            :disabled="wizard.selectedCount.value === 0 || wizard.isBusy.value"
            :loading="wizard.isBusy.value"
            data-testid="bank-import-confirm"
            @click="wizard.confirmImport"
          >
            {{ t("import.preview.confirm") }}
          </NButton>
        </div>
      </NCard>

      <BankImportPreviewTable
        :rows="wizard.preview.value?.transactions ?? []"
        :selected-ids="wizard.selectedIds.value"
        @toggle="wizard.toggleTransaction"
      />
    </template>

    <ImportResult
      v-else-if="wizard.step.value === 'success' && wizard.result.value"
      :result="wizard.result.value"
      :description="t('import.bank.success.description')"
      :import-another-label="t('import.bank.success.importAnother')"
      @go-to-transactions="emit('go-to-transactions')"
      @import-another="wizard.reset"
    />
  </div>
</template>

<style scoped>
.bank-import {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bank-import__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.bank-import__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
