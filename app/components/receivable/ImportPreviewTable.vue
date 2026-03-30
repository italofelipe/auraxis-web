<script setup lang="ts">
import { NButton, NEmpty, NSpace } from "naive-ui";

import { formatCurrency } from "~/utils/currency";
import type { ParsedRow } from "~/features/receivables/model/receivables";

interface Props {
  /** Parsed rows returned from the CSV upload preview. */
  rows: ParsedRow[];
  /** Whether the confirm mutation is currently in progress. */
  isLoading?: boolean;
  /** Number of successfully created entries after confirmation, if available. */
  createdCount?: number | null;
}

interface Emits {
  /** Emitted when the user confirms the import. */
  (e: "confirm"): void;
}


withDefaults(defineProps<Props>(), {
  isLoading: false,
  createdCount: null,
});

defineEmits<Emits>();

/**
 * Formats an ISO date string as a localized pt-BR short date.
 *
 * @param isoDate ISO date string.
 * @returns Formatted date string.
 */
const formatDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoDate));
};
</script>

<template>
  <div class="import-preview-table">
    <NEmpty
      v-if="rows.length === 0 && createdCount === null"
      :description="$t('receivable.importPreview.empty')"
    />

    <template v-else>
      <div
        v-if="createdCount !== null"
        class="import-preview-table__success"
      >
        {{ $t('receivable.importPreview.successMessage', { count: createdCount }) }}
      </div>

      <div v-if="rows.length > 0" class="import-preview-table__wrapper">
        <table class="import-preview-table__table">
          <thead>
            <tr>
              <th class="import-preview-table__th">{{ $t('receivable.importPreview.columns.description') }}</th>
              <th class="import-preview-table__th">{{ $t('receivable.importPreview.columns.amount') }}</th>
              <th class="import-preview-table__th">{{ $t('receivable.importPreview.columns.date') }}</th>
              <th class="import-preview-table__th">{{ $t('receivable.importPreview.columns.category') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="row.externalId ?? index"
              class="import-preview-table__row"
            >
              <td class="import-preview-table__td">{{ row.description }}</td>
              <td class="import-preview-table__td">{{ formatCurrency(row.amount) }}</td>
              <td class="import-preview-table__td">{{ formatDate(row.date) }}</td>
              <td class="import-preview-table__td">{{ row.category }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <NSpace v-if="rows.length > 0 && createdCount === null" justify="end" class="import-preview-table__footer">
        <NButton
          type="primary"
          :loading="isLoading"
          :disabled="isLoading"
          @click="$emit('confirm')"
        >
          {{ $t('receivable.importPreview.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </div>
</template>

<style scoped>
.import-preview-table {
  display: grid;
  gap: var(--space-3, 12px);
}

.import-preview-table__success {
  padding: var(--space-3, 12px);
  border-radius: var(--border-radius-md, 6px);
  background-color: var(--color-success-subtle, #f0faf5);
  color: var(--color-success, #18a058);
  font-weight: var(--font-weight-medium, 500);
}

.import-preview-table__wrapper {
  overflow-x: auto;
}

.import-preview-table__table {
  width: 100%;
  border-collapse: collapse;
}

.import-preview-table__th {
  text-align: left;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
  border-bottom: 1px solid var(--color-outline-subtle, #eee);
}

.import-preview-table__row:nth-child(even) {
  background-color: var(--color-surface-subtle, #fafafa);
}

.import-preview-table__td {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-outline-subtle, #eee);
}

.import-preview-table__footer {
  padding-top: var(--space-2, 8px);
}
</style>
