<script setup lang="ts">
import {
  NCard,
  NButton,
  NStatistic,
  NEmpty,
  NRadioGroup,
  NRadioButton,
} from "naive-ui";
import AlertItem from "~/features/alerts/components/AlertItem/AlertItem.vue";
import { MOCK_ALERTS } from "~/features/alerts/mock/alerts.mock";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Alertas",
  pageSubtitle: "Notificações e alertas do período",
});

useHead({ title: "Alertas | Auraxis" });

type FilterValue = "all" | "unread" | "read";

const alerts = ref([...MOCK_ALERTS]);
const activeFilter = ref<FilterValue>("all");

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "unread", label: "Não lidos" },
  { value: "read", label: "Lidos" },
];

const filteredAlerts = computed(() => {
  if (activeFilter.value === "unread") {return alerts.value.filter((a) => !a.is_read);}
  if (activeFilter.value === "read") {return alerts.value.filter((a) => a.is_read);}
  return alerts.value;
});

const totalCount = computed(() => alerts.value.length);
const unreadCount = computed(() => alerts.value.filter((a) => !a.is_read).length);
const readCount = computed(() => alerts.value.filter((a) => a.is_read).length);

/**
 * Marks all alerts as read in local state.
 */
const onMarkAllRead = (): void => {
  alerts.value = alerts.value.map((a) => ({ ...a, is_read: true }));
};

/**
 * Marks a single alert as read by id.
 *
 * @param id - The alert id to mark as read.
 */
const onMarkRead = (id: string): void => {
  alerts.value = alerts.value.map((a) =>
    a.id === id ? { ...a, is_read: true } : a,
  );
};

/**
 * Deletes a single alert by id from local state.
 *
 * @param id - The alert id to delete.
 */
const onDelete = (id: string): void => {
  alerts.value = alerts.value.filter((a) => a.id !== id);
};
</script>

<template>
  <div class="alerts-page">
    <div class="alerts-page__header">
      <div class="alerts-page__title-block">
        <span class="alerts-page__title">Alertas</span>
        <span class="alerts-page__subtitle">Notificações e alertas do período</span>
      </div>
      <NButton
        type="default"
        size="medium"
        :disabled="unreadCount === 0"
        @click="onMarkAllRead"
      >
        Marcar todos como lidos
      </NButton>
    </div>

    <NCard :bordered="true" class="alerts-page__summary-card">
      <div class="alerts-page__summary-stats">
        <NStatistic label="Total" :value="String(totalCount)" />
        <NStatistic label="Não lidos" :value="String(unreadCount)" />
        <NStatistic label="Lidos" :value="String(readCount)" />
      </div>
    </NCard>

    <div class="alerts-page__filter-bar">
      <NRadioGroup v-model:value="activeFilter" size="medium">
        <NRadioButton
          v-for="opt in FILTER_OPTIONS"
          :key="opt.value"
          :value="opt.value"
          :label="opt.label"
        />
      </NRadioGroup>
    </div>

    <NEmpty
      v-if="filteredAlerts.length === 0"
      description="Nenhum alerta encontrado para o filtro selecionado."
      class="alerts-page__empty"
    />

    <div v-else class="alerts-page__list">
      <AlertItem
        v-for="alert in filteredAlerts"
        :key="alert.id"
        :alert="alert"
        @mark-read="onMarkRead"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.alerts-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.alerts-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alerts-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.alerts-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.alerts-page__summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
}

.alerts-page__filter-bar {
  display: flex;
  align-items: center;
}

.alerts-page__empty {
  padding: var(--space-4) 0;
}

.alerts-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
