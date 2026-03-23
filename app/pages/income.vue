<script setup lang="ts">
import { NCard, NEmpty, NSkeleton, NSpace, NTabPane, NTabs } from "naive-ui";
import { ref } from "vue";

import CsvUploadForm from "~/features/receivables/components/CsvUploadForm.vue";
import ImportPreviewTable from "~/features/receivables/components/ImportPreviewTable.vue";
import ReceivableItem from "~/features/receivables/components/ReceivableItem.vue";
import RevenueSummaryCard from "~/features/receivables/components/RevenueSummaryCard.vue";
import { useConfirmImportMutation } from "~/features/receivables/queries/use-confirm-import-mutation";
import { useCsvUploadMutation } from "~/features/receivables/queries/use-csv-upload-mutation";
import { useReceivablesQuery } from "~/features/receivables/queries/use-receivables-query";
import { useRevenueSummaryQuery } from "~/features/receivables/queries/use-revenue-summary-query";
import type { CsvUploadPayload } from "~/features/receivables/api/receivables.client";
import type { ParsedRow } from "~/features/receivables/model/receivables";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Receitas",
  pageSubtitle: "Receitas e importação de extratos",
});

const activeTab = ref<"import" | "list">("list");

const summaryQuery = useRevenueSummaryQuery();
const receivablesQuery = useReceivablesQuery();

const csvUploadMutation = useCsvUploadMutation();
const confirmImportMutation = useConfirmImportMutation();

const previewRows = ref<ParsedRow[]>([]);
const createdCount = ref<number | null>(null);

/** @param payload CSV upload payload with content and column mapping. */
const handlePreview = (payload: CsvUploadPayload): void => {
  createdCount.value = null;
  previewRows.value = [];

  csvUploadMutation.mutate(payload, {
    onSuccess: (rows: ParsedRow[]) => {
      previewRows.value = rows;
    },
  });
};

/**
 * Converts preview rows to the DTO shape, confirms import and switches to
 * the list tab on success. Invalidates both receivables and summary queries.
 */
const handleConfirm = (): void => {
  const dtoRows = previewRows.value.map((row) => ({
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category,
    external_id: row.externalId,
  }));

  confirmImportMutation.mutate(dtoRows, {
    onSuccess: (result) => {
      createdCount.value = result.created;
      previewRows.value = [];
      void receivablesQuery.refetch();
      void summaryQuery.refetch();
    },
  });
};

/** @param _id Receivable entry ID. Stub — mark-received mutation to be wired in follow-up. */
const handleReceive = (_id: string): void => {
  // mark-received mutation to be wired in follow-up
};

/** @param _id Receivable entry ID. Stub — delete mutation to be wired in follow-up. */
const handleDelete = (_id: string): void => {
  // delete mutation to be wired in follow-up
};
</script>

<template>
  <div class="income-page">
    <NSkeleton
      v-if="summaryQuery.isLoading.value"
      height="100px"
      :sharp="false"
    />

    <UiBaseCard
      v-else-if="summaryQuery.isError.value"
      :title="t('pages.income.errorSummaryTitle')"
    >
      <p class="income-page__support-copy">
        {{ t('pages.income.errorSummaryMessage') }}
      </p>
    </UiBaseCard>

    <RevenueSummaryCard
      v-else-if="summaryQuery.data.value"
      :summary="summaryQuery.data.value"
    />

    <NTabs v-model:value="activeTab" type="line" animated>
      <NTabPane name="import" :tab="t('pages.income.tabs.import')">
        <NSpace vertical :size="16">
          <CsvUploadForm @preview="handlePreview" />

          <NCard
            v-if="csvUploadMutation.isPending.value || previewRows.length > 0 || createdCount !== null"
            :title="t('pages.income.preview')"
          >
            <NSkeleton
              v-if="csvUploadMutation.isPending.value"
              height="120px"
              :sharp="false"
            />

            <p
              v-else-if="csvUploadMutation.isError.value"
              class="income-page__error-copy"
            >
              {{ t('pages.income.csvError') }}
            </p>

            <ImportPreviewTable
              v-else
              :rows="previewRows"
              :is-loading="confirmImportMutation.isPending.value"
              :created-count="createdCount"
              @confirm="handleConfirm"
            />
          </NCard>
        </NSpace>
      </NTabPane>

      <NTabPane name="list" :tab="t('pages.income.tabs.list')">
        <NSpace v-if="receivablesQuery.isLoading.value" vertical :size="8">
          <NSkeleton height="72px" :sharp="false" />
          <NSkeleton height="72px" :sharp="false" />
          <NSkeleton height="72px" :sharp="false" />
        </NSpace>

        <UiBaseCard
          v-else-if="receivablesQuery.isError.value"
          :title="t('pages.income.errorListTitle')"
        >
          <p class="income-page__support-copy">
            {{ t('pages.income.errorListMessage') }}
          </p>
        </UiBaseCard>

        <NEmpty
          v-else-if="!receivablesQuery.data.value || receivablesQuery.data.value.length === 0"
          :description="t('pages.income.emptyList')"
        />

        <NCard v-else :title="t('pages.income.myIncome')">
          <ReceivableItem
            v-for="entry in receivablesQuery.data.value"
            :key="entry.id"
            :entry="entry"
            @receive="handleReceive"
            @delete="handleDelete"
          />
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.income-page {
  display: grid;
  gap: var(--space-4);
}

.income-page__support-copy {
  margin: 0;
  color: var(--color-text-muted);
}

.income-page__error-copy {
  margin: 0;
  color: var(--color-negative);
}
</style>
