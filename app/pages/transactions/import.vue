<script setup lang="ts">
import { computed } from "vue";
import { NAlert, NButton, NCard, NTag, NText } from "naive-ui";

import ImportDropzone from "~/features/import/components/ImportDropzone.vue";
import ImportFinishLaterModal from "~/features/import/components/ImportFinishLaterModal.vue";
import ImportMappingModal from "~/features/import/components/ImportMappingModal.vue";
import ImportPreviewTable from "~/features/import/components/ImportPreviewTable.vue";
import ImportRejectedRowsPanel from "~/features/import/components/ImportRejectedRowsPanel.vue";
import ImportResult from "~/features/import/components/ImportResult.vue";
import ImportReviewModal from "~/features/import/components/ImportReviewModal.vue";
import ImportUpsellBanner from "~/features/import/components/ImportUpsellBanner.vue";
import { IMPORT_FEATURE_FLAG_KEY } from "~/features/import/model/import-config";
import { useImportWizard } from "~/features/import/composables/useImportWizard";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Importar transações",
  pageSubtitle: "Traga seus lançamentos de uma planilha CSV ou XLSX",
});

useHead({ title: "Importar transações | Auraxis" });

const { t } = useI18n();
const router = useRouter();
const isEnabled = useFeatureFlag(IMPORT_FEATURE_FLAG_KEY);
const wizard = useImportWizard();

const headers = computed((): readonly string[] => wizard.detectResult.value?.headers ?? []);

/** Volta para a lista de transações depois do import. */
const goToTransactions = (): void => {
  void router.push("/transactions");
};

/** Leva ao paywall quando a cota gratuita do mês acabou. */
const goToUpgrade = (): void => {
  void router.push("/checkout");
};
</script>

<template>
  <div class="import-page">
    <NAlert v-if="!isEnabled" type="info" :title="t('import.disabled.title')">
      {{ t("import.disabled.description") }}
    </NAlert>

    <template v-else>
      <ImportUpsellBanner
        v-if="wizard.isUpsell.value"
        @upgrade="goToUpgrade"
        @dismiss="wizard.dismissError"
      />

      <NAlert
        v-else-if="wizard.isPreviewExpired.value"
        type="warning"
        :title="t('import.errors.expiredTitle')"
        data-testid="import-expired"
      >
        <p>{{ t("import.errors.expiredDescription") }}</p>
        <NButton size="small" @click="wizard.reset">
          {{ t("import.errors.restart") }}
        </NButton>
      </NAlert>

      <NAlert
        v-else-if="wizard.error.value"
        type="error"
        closable
        :title="t('import.errors.genericTitle')"
        data-testid="import-error"
        @close="wizard.dismissError"
      >
        {{ t("import.errors.genericDescription") }}
      </NAlert>

      <NCard v-if="wizard.step.value === 'select'" :title="t('import.select.title')">
        <NText depth="3">{{ t("import.select.description") }}</NText>
        <ImportDropzone
          :disabled="wizard.isBusy.value"
          @select="(file: File) => wizard.selectFile(file)"
        />
      </NCard>

      <template v-if="wizard.step.value === 'preview' || wizard.step.value === 'review'">
        <NCard :title="t('import.preview.title')">
          <div class="import-page__summary">
            <NText strong data-testid="import-preview-summary">
              {{ t("import.preview.summary", {
                selected: wizard.selectedCount.value,
                total: wizard.totalCount.value,
              }) }}
            </NText>
            <NTag v-if="wizard.duplicateCount.value > 0" type="warning" :bordered="false">
              {{ t("import.preview.duplicates", wizard.duplicateCount.value) }}
            </NTag>
            <NTag
              v-if="wizard.review.totalCount.value > 0"
              type="error"
              :bordered="false"
              data-testid="import-incomplete-tag"
            >
              {{ t("import.preview.incompleteCount", wizard.review.pendingCount.value) }}
            </NTag>
          </div>

          <div class="import-page__actions">
            <NButton quaternary data-testid="import-start-over" @click="wizard.reset">
              {{ t("import.preview.startOver") }}
            </NButton>
            <NButton
              type="primary"
              :disabled="wizard.selectedCount.value === 0 || wizard.isBusy.value"
              :loading="wizard.isBusy.value"
              data-testid="import-confirm"
              @click="wizard.confirmImport"
            >
              {{ t("import.preview.confirm") }}
            </NButton>
          </div>
        </NCard>

        <ImportRejectedRowsPanel :rows="wizard.rejectedRows.value" />

        <ImportPreviewTable
          :rows="wizard.preview.value?.transactions ?? []"
          :selected-ids="wizard.selectedIds.value"
          @toggle="wizard.toggleTransaction"
        />
      </template>

      <ImportResult
        v-if="wizard.step.value === 'success' && wizard.result.value"
        :result="wizard.result.value"
        @go-to-transactions="goToTransactions"
        @import-another="wizard.reset"
      />

      <ImportMappingModal
        :show="wizard.step.value === 'mapping'"
        :fields="wizard.mappingFields.value"
        :headers="headers"
        :busy="wizard.isBusy.value"
        @change="wizard.setMappingField"
        @confirm="wizard.confirmMapping"
        @cancel="wizard.cancelMapping"
      />

      <ImportReviewModal
        :show="wizard.step.value === 'review' && !wizard.isFinishLaterOpen.value"
        :cards="wizard.review.cards.value"
        :total-count="wizard.review.totalCount.value"
        :resolved-count="wizard.review.resolvedCount.value"
        :pending-count="wizard.review.pendingCount.value"
        :is-complete="wizard.review.isComplete.value"
        :busy="wizard.isBusy.value"
        @answer="wizard.review.answer"
        @submit="wizard.submitReview"
        @finish-later="wizard.openFinishLater"
        @cancel="wizard.cancelReview"
      />

      <ImportFinishLaterModal
        :show="wizard.isFinishLaterOpen.value"
        :busy="wizard.isBusy.value"
        @confirm="wizard.confirmWithPlaceholders"
        @cancel="wizard.dismissFinishLater"
      />
    </template>
  </div>
</template>

<style scoped>
.import-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.import-page__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.import-page__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
