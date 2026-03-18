<script setup lang="ts">
import { NButton, NSpace, NTag } from "naive-ui";

import { formatCurrency } from "~/utils/currency";
import type { ReceivableEntry } from "~/features/receivables/model/receivables";

interface Props {
  /** Receivable entry to display. */
  entry: ReceivableEntry;
}

interface Emits {
  /** Emitted when the user marks the entry as received or deletes it. */
  (e: "receive" | "delete", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Resolves the NaiveUI tag type for a given receivable status.
 *
 * @param status Receivable status value.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  status: ReceivableEntry["status"],
): "success" | "warning" | "error" => {
  if (status === "received") { return "success"; }
  if (status === "pending") { return "warning"; }
  return "error";
};

/**
 * Returns the localized label for the given receivable status.
 *
 * @param status Receivable status value.
 * @returns Localized status label.
 */
const statusLabel = (status: ReceivableEntry["status"]): string => {
  if (status === "received") { return "Recebido"; }
  if (status === "pending") { return "Pendente"; }
  return "Cancelado";
};

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

/**
 * Emits the receive event with the current entry ID.
 */
const handleReceive = (): void => {
  emit("receive", props.entry.id);
};

/**
 * Emits the delete event with the current entry ID.
 */
const handleDelete = (): void => {
  emit("delete", props.entry.id);
};
</script>

<template>
  <div class="receivable-item">
    <div class="receivable-item__info">
      <div class="receivable-item__header">
        <span class="receivable-item__description">{{ entry.description }}</span>
        <NTag
          :type="statusTagType(entry.status)"
          size="small"
          round
        >
          {{ statusLabel(entry.status) }}
        </NTag>
      </div>

      <div class="receivable-item__meta">
        <span class="receivable-item__amount">{{ formatCurrency(entry.amount) }}</span>
        <span class="receivable-item__date">
          Vence em {{ formatDate(entry.expectedDate) }}
        </span>
        <span v-if="entry.category" class="receivable-item__category">
          {{ entry.category }}
        </span>
      </div>
    </div>

    <NSpace :size="8" class="receivable-item__actions">
      <NButton
        v-if="entry.status === 'pending'"
        type="primary"
        size="small"
        @click="handleReceive"
      >
        Recebido
      </NButton>
      <NButton
        type="default"
        size="small"
        @click="handleDelete"
      >
        Excluir
      </NButton>
    </NSpace>
  </div>
</template>

<style scoped>
.receivable-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) 0;
  border-bottom: 1px solid var(--color-outline-subtle, #eee);
  flex-wrap: wrap;
}

.receivable-item:last-child {
  border-bottom: none;
}

.receivable-item__info {
  flex: 1 1 auto;
  min-width: 0;
}

.receivable-item__header {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex-wrap: wrap;
  margin-bottom: var(--space-1, 4px);
}

.receivable-item__description {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-primary);
}

.receivable-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  flex-wrap: wrap;
}

.receivable-item__amount {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary);
}

.receivable-item__date,
.receivable-item__category {
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
}

.receivable-item__actions {
  flex-shrink: 0;
}
</style>
