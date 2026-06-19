<script setup lang="ts">
import {
  BarChart3,
  Pencil,
  PlusCircle,
  ReceiptText,
  Trash2,
} from "lucide-vue-next";
import { NButton, NTag } from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { formatCurrency } from "~/utils/currency";

const props = defineProps<{
  cards: readonly CreditCardDto[];
  selectedCardId?: string | null;
}>();

const emit = defineEmits<{
  select: [card: CreditCardDto];
  viewDashboard: [card: CreditCardDto];
  addExpense: [card: CreditCardDto];
  edit: [card: CreditCardDto];
  delete: [card: CreditCardDto];
}>();

/**
 * Formats the card closing and due-day pair for table scanning.
 *
 * @param card Card row being rendered.
 * @returns Human-readable cycle label.
 */
const cycleLabel = (card: CreditCardDto): string => {
  if (card.closing_day === null || card.due_day === null) {
    return "Ciclo incompleto";
  }
  return `Fecha dia ${card.closing_day} · vence dia ${card.due_day}`;
};

/**
 * Returns a localized benefit count for the benefits column.
 *
 * @param card Card row being rendered.
 * @returns Localized benefit count.
 */
const benefitsCount = (card: CreditCardDto): string => {
  const count = card.benefits?.length ?? 0;
  return count === 1 ? "1 benefício" : `${count} benefícios`;
};
</script>

<template>
  <div class="cc-table-wrap" data-testid="cc-table">
    <table class="cc-table">
      <thead>
        <tr>
          <th>Cartão</th>
          <th>Banco</th>
          <th>Limite</th>
          <th>Ciclo</th>
          <th>Benefícios</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="card in props.cards"
          :key="card.id"
          :class="{ 'cc-table__row--selected': card.id === props.selectedCardId }"
          @click="emit('select', card)"
        >
          <td>
            <strong>{{ card.name }}</strong>
            <span v-if="card.brand" class="cc-table__muted">{{ card.brand }}</span>
          </td>
          <td>{{ card.bank ?? "—" }}</td>
          <td>{{ card.limit_amount !== null ? formatCurrency(card.limit_amount) : "—" }}</td>
          <td>{{ cycleLabel(card) }}</td>
          <td>
            <NTag :bordered="false" size="small" type="success">
              {{ benefitsCount(card) }}
            </NTag>
          </td>
          <td>
            <div class="cc-table__actions">
              <NButton
                size="small"
                tertiary
                circle
                title="Dashboard"
                @click.stop="emit('viewDashboard', card)"
              >
                <BarChart3 :size="15" />
              </NButton>
              <NButton
                size="small"
                tertiary
                circle
                title="Ver fatura"
                @click.stop="emit('viewDashboard', card)"
              >
                <ReceiptText :size="15" />
              </NButton>
              <NButton
                size="small"
                type="primary"
                tertiary
                circle
                title="Lançar despesa"
                @click.stop="emit('addExpense', card)"
              >
                <PlusCircle :size="15" />
              </NButton>
              <NButton
                size="small"
                tertiary
                circle
                title="Editar"
                @click.stop="emit('edit', card)"
              >
                <Pencil :size="15" />
              </NButton>
              <NButton
                size="small"
                tertiary
                circle
                type="error"
                title="Remover"
                @click.stop="emit('delete', card)"
              >
                <Trash2 :size="15" />
              </NButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cc-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-table {
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;
}

.cc-table th,
.cc-table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
  text-align: left;
  vertical-align: middle;
}

.cc-table th {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.cc-table tbody tr {
  cursor: pointer;
}

.cc-table tbody tr:hover,
.cc-table__row--selected {
  background: var(--color-bg-elevated);
}

.cc-table__muted {
  display: block;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.cc-table__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
</style>
