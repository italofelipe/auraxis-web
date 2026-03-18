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

definePageMeta({ middleware: ["authenticated"] });

const activeTab = ref<"import" | "list">("list");

const summaryQuery = useRevenueSummaryQuery();
const receivablesQuery = useReceivablesQuery();

const csvUploadMutation = useCsvUploadMutation();
const confirmImportMutation = useConfirmImportMutation();

const previewRows = ref<ParsedRow[]>([]);
const createdCount = ref<number | null>(null);

/**
 * Handles preview payload emitted by CsvUploadForm.
 * Calls the upload mutation and stores the returned rows for display.
 *
 * @param payload Upload payload with CSV content and column map.
 */
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
 * Handles import confirmation.
 * Converts ParsedRow[] to the DTO shape expected by the confirm mutation,
 * then invalidates queries and switches to the list tab on success.
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

/**
 * Handles the "receive" action on a receivable item.
 * For now, this is a placeholder: actual mark-received logic will be wired
 * when the page is extended with a mark-received mutation.
 *
 * @param _id Receivable entry identifier.
 */
const handleReceive = (_id: string): void => {
  // mark-received mutation to be wired in follow-up
};

/**
 * Handles the "delete" action on a receivable item.
 * For now, this is a placeholder: actual delete logic will be wired
 * when the page is extended with a delete mutation.
 *
 * @param _id Receivable entry identifier.
 */
const handleDelete = (_id: string): void => {
  // delete mutation to be wired in follow-up
};
</script>

<template>
  <div class="receitas-page">
    <header class="receitas-page__header">
      <h1>Receitas</h1>
      <p class="receitas-page__subtitle">
        Gerencie suas receitas, importe extratos via CSV e acompanhe o resumo de entradas.
      </p>
    </header>

    <!-- Summary: loading state -->
    <NSkeleton
      v-if="summaryQuery.isLoading.value"
      height="100px"
      :sharp="false"
    />

    <!-- Summary: error state -->
    <UiBaseCard
      v-else-if="summaryQuery.isError.value"
      title="Erro ao carregar resumo"
    >
      <p class="receitas-page__support-copy">
        Não foi possível carregar o resumo de receitas. Tente novamente.
      </p>
    </UiBaseCard>

    <!-- Summary: loaded state -->
    <RevenueSummaryCard
      v-else-if="summaryQuery.data.value"
      :summary="summaryQuery.data.value"
    />

    <!-- Tabs -->
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- Import tab -->
      <NTabPane name="import" tab="Importar">
        <NSpace vertical :size="16">
          <CsvUploadForm @preview="handlePreview" />

          <NCard
            v-if="csvUploadMutation.isPending.value || previewRows.length > 0 || createdCount !== null"
            title="Pré-visualização"
          >
            <NSkeleton
              v-if="csvUploadMutation.isPending.value"
              height="120px"
              :sharp="false"
            />

            <p
              v-else-if="csvUploadMutation.isError.value"
              class="receitas-page__error-copy"
            >
              Erro ao processar o CSV. Verifique o arquivo e o mapeamento de colunas.
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

      <!-- List tab -->
      <NTabPane name="list" tab="Receitas">
        <!-- Loading state -->
        <NSpace v-if="receivablesQuery.isLoading.value" vertical :size="8">
          <NSkeleton height="72px" :sharp="false" />
          <NSkeleton height="72px" :sharp="false" />
          <NSkeleton height="72px" :sharp="false" />
        </NSpace>

        <!-- Error state -->
        <UiBaseCard
          v-else-if="receivablesQuery.isError.value"
          title="Erro ao carregar receitas"
        >
          <p class="receitas-page__support-copy">
            Não foi possível carregar suas receitas. Tente novamente.
          </p>
        </UiBaseCard>

        <!-- Empty state -->
        <NEmpty
          v-else-if="!receivablesQuery.data.value || receivablesQuery.data.value.length === 0"
          description="Nenhuma receita cadastrada. Importe um CSV ou adicione manualmente."
        />

        <!-- Loaded state -->
        <NCard v-else title="Minhas Receitas">
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
.receitas-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
}

.receitas-page__header {
  margin-bottom: var(--space-2, 8px);
}

.receitas-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.receitas-page__support-copy {
  margin: 0;
  color: var(--color-text-subtle, #888);
}

.receitas-page__error-copy {
  margin: 0;
  color: var(--color-error, #d03050);
}
</style>
