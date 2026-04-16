<script setup lang="ts">
import { NButton, NDatePicker, NSelect, type SelectOption } from "naive-ui";
import { Calendar, GripVertical, List, Tag, TrendingDown, TrendingUp } from "lucide-vue-next";

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
}>();
</script>

<template>
  <div class="tx-toolbar">
    <NSelect
      :value="filterType"
      :options="typeOptions"
      size="small"
      style="min-width: 130px"
      @update:value="emit('update:filterType', $event)"
    />
    <NSelect
      :value="filterStatus"
      :options="statusOptions"
      size="small"
      style="min-width: 150px"
      @update:value="emit('update:filterStatus', $event)"
    />
    <NDatePicker
      :value="filterStartDate"
      type="date"
      clearable
      size="small"
      :placeholder="$t('transactions.filter.startDate')"
      @update:value="emit('update:filterStartDate', $event)"
    />
    <NDatePicker
      :value="filterEndDate"
      type="date"
      clearable
      size="small"
      :placeholder="$t('transactions.filter.endDate')"
      @update:value="emit('update:filterEndDate', $event)"
    />
    <NSelect
      :value="filterTagId"
      :options="tagOptions"
      size="small"
      style="min-width: 140px"
      clearable
      @update:value="emit('update:filterTagId', $event)"
    />
    <NButton
      v-if="filterType !== 'all' || filterStatus !== 'all' || filterStartDate || filterEndDate || filterTagId !== 'all'"
      size="small"
      secondary
      @click="emit('clear-filters')"
    >
      {{ $t('transactions.filter.clear') }}
    </NButton>

    <div class="tx-toolbar__spacer" />

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

    <NButton size="small" @click="emit('add-income')">
      <template #icon><TrendingUp :size="14" /></template>
      {{ $t('transactions.addIncome') }}
    </NButton>
    <NButton type="primary" size="small" @click="emit('add-expense')">
      <template #icon><TrendingDown :size="14" /></template>
      {{ $t('transactions.addExpense') }}
    </NButton>
  </div>
</template>

<style scoped>
.tx-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.tx-toolbar__spacer {
  flex: 1;
}
</style>
