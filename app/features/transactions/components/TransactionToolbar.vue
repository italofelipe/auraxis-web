<script setup lang="ts">
import { h } from "vue";
import { NButton, NDatePicker, NSelect, type SelectOption } from "naive-ui";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  GripVertical,
  List,
  ListFilter,
  MinusCircle,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-vue-next";

defineProps<{
  filterType: string;
  filterStatus: string;
  filterStartDate: number | null;
  filterEndDate: number | null;
  filterTagId: string;
  typeOptions: SelectOption[];
  statusOptions: SelectOption[];
  tagOptions: SelectOption[];
  viewMode: string;
  reorderMode: boolean;
}>();

const emit = defineEmits<{
  "update:filterType": [value: string];
  "update:filterStatus": [value: string];
  "update:filterStartDate": [value: number | null];
  "update:filterEndDate": [value: number | null];
  "update:filterTagId": [value: string];
  "update:viewMode": [value: string];
  "clear-filters": [];
  "enter-reorder": [];
  "exit-reorder": [];
  "add-income": [];
  "add-expense": [];
  "create-tag": [];
  "open-trash": [];
  "open-export": [];
}>();

/**
 * Returns the icon used by a type or status option.
 *
 * @param value Option value emitted by Naive UI.
 * @param group Option group requesting the icon.
 * @returns Lucide icon component for the option.
 */
function optionIcon(value: unknown, group: "type" | "status"): LucideIcon {
  if (group === "type") {
    if (value === "income") { return TrendingUp; }
    if (value === "expense") { return TrendingDown; }
    return ListFilter;
  }
  if (value === "paid") { return CheckCircle2; }
  if (value === "pending") { return Clock3; }
  if (value === "overdue") { return AlertCircle; }
  if (value === "cancelled") { return XCircle; }
  if (value === "postponed") { return MinusCircle; }
  return ListFilter;
}

/**
 * Renders a transaction type option with its icon.
 *
 * @param option Select option rendered by Naive UI.
 * @returns Virtual node used as the option label.
 */
function renderTypeLabel(option: SelectOption): ReturnType<typeof h> {
  const Icon = optionIcon(option.value, "type");
  return h("span", { class: "tx-select-option" }, [
    h(Icon, { size: 14 }),
    h("span", String(option.label ?? "")),
  ]);
}

/**
 * Renders a transaction status option with its icon.
 *
 * @param option Select option rendered by Naive UI.
 * @returns Virtual node used as the option label.
 */
function renderStatusLabel(option: SelectOption): ReturnType<typeof h> {
  const Icon = optionIcon(option.value, "status");
  return h("span", { class: "tx-select-option" }, [
    h(Icon, { size: 14 }),
    h("span", String(option.label ?? "")),
  ]);
}
</script>

<template>
  <section class="tx-toolbar" aria-label="Filtros e ações de transações">
    <div class="tx-toolbar__filters">
      <label class="tx-toolbar__field tx-toolbar__field--compact">
        <span><ListFilter :size="13" /> Tipo</span>
        <NSelect
          :value="filterType"
          :options="typeOptions"
          :render-label="renderTypeLabel"
          size="small"
          @update:value="emit('update:filterType', $event)"
        />
      </label>

      <label class="tx-toolbar__field tx-toolbar__field--compact">
        <span><CheckCircle2 :size="13" /> Status</span>
        <NSelect
          :value="filterStatus"
          :options="statusOptions"
          :render-label="renderStatusLabel"
          size="small"
          @update:value="emit('update:filterStatus', $event)"
        />
      </label>

      <label class="tx-toolbar__field">
        <span><Calendar :size="13" /> Início</span>
        <NDatePicker
          :value="filterStartDate"
          type="date"
          size="small"
          format="dd/MM/yyyy"
          :placeholder="$t('transactions.filter.startDate')"
          @update:value="emit('update:filterStartDate', $event)"
        />
      </label>

      <label class="tx-toolbar__field">
        <span><Calendar :size="13" /> Fim</span>
        <NDatePicker
          :value="filterEndDate"
          type="date"
          size="small"
          format="dd/MM/yyyy"
          :placeholder="$t('transactions.filter.endDate')"
          @update:value="emit('update:filterEndDate', $event)"
        />
      </label>

      <label class="tx-toolbar__field tx-toolbar__field--tag">
        <span><Tag :size="13" /> Tag</span>
        <NSelect
          :value="filterTagId"
          :options="tagOptions"
          size="small"
          clearable
          @update:value="emit('update:filterTagId', $event ?? 'all')"
        />
      </label>

      <NButton
        class="tx-toolbar__clear"
        size="small"
        secondary
        @click="emit('clear-filters')"
      >
        {{ $t('transactions.filter.clear') }}
      </NButton>
    </div>

    <div class="tx-toolbar__actions">
      <NButton
        size="small"
        :type="viewMode === 'calendar' ? 'primary' : 'default'"
        :title="viewMode === 'calendar' ? $t('transactions.view.list') : $t('transactions.view.calendar')"
        @click="emit('update:viewMode', viewMode === 'list' ? 'calendar' : 'list')"
      >
        <template #icon>
          <Calendar v-if="viewMode === 'list'" :size="14" />
          <List v-else :size="14" />
        </template>
      </NButton>

      <NButton
        size="small"
        :type="reorderMode ? 'primary' : 'default'"
        @click="reorderMode ? emit('exit-reorder') : emit('enter-reorder')"
      >
        <template #icon><GripVertical :size="14" /></template>
        {{ reorderMode ? $t('transactions.reorder.exit') : $t('transactions.reorder.enter') }}
      </NButton>

      <NButton size="small" secondary @click="emit('create-tag')">
        <template #icon><Tag :size="14" /></template>
        {{ $t('transactions.createTag') }}
      </NButton>

      <NButton
        size="small"
        secondary
        :title="$t('transactions.trash.title')"
        @click="emit('open-trash')"
      >
        <template #icon><Trash2 :size="14" /></template>
        {{ $t('transactions.trash.link') }}
      </NButton>

      <NButton
        size="small"
        secondary
        :title="$t('transactions.export.title')"
        @click="emit('open-export')"
      >
        <template #icon><Download :size="14" /></template>
        {{ $t('transactions.export.action') }}
      </NButton>

      <NButton size="small" @click="emit('add-income')">
        <template #icon><TrendingUp :size="14" /></template>
        {{ $t('transactions.addIncome') }}
      </NButton>
      <NButton type="primary" size="small" @click="emit('add-expense')">
        <template #icon><TrendingDown :size="14" /></template>
        {{ $t('transactions.addExpense') }}
      </NButton>
    </div>
  </section>
</template>

<style scoped>
.tx-toolbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: stretch;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-elevated) 74%, transparent);
}

.tx-toolbar__filters {
  display: grid;
  grid-template-columns:
    minmax(140px, 1fr)
    minmax(140px, 1fr)
    minmax(150px, 1fr)
    minmax(150px, 1fr)
    minmax(160px, 1.15fr)
    auto;
  gap: var(--space-3);
  align-items: end;
}

.tx-toolbar__field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.tx-toolbar__field > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tx-toolbar__clear {
  align-self: end;
}

.tx-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
}

:deep(.tx-select-option) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

@media (max-width: 1180px) {
  .tx-toolbar__actions {
    justify-content: flex-start;
  }
}

@media (max-width: 860px) {
  .tx-toolbar__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .tx-toolbar__filters {
    grid-template-columns: 1fr;
  }
}
</style>
