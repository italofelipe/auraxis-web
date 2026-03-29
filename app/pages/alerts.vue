<script setup lang="ts">
import {
  NCard,
  NButton,
  NStatistic,
  NRadioGroup,
  NRadioButton,
} from "naive-ui";
import { useAlertsQuery } from "~/features/alerts/queries/use-alerts-query";
import { useMarkAlertReadMutation } from "~/features/alerts/queries/use-mark-alert-read-mutation";
import { useDeleteAlertMutation } from "~/features/alerts/queries/use-delete-alert-mutation";
import type { Alert } from "~/features/alerts/model/alerts";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Alertas",
  pageSubtitle: "Notificações e alertas do período",
});

useHead({ title: "Alertas | Auraxis" });

type FilterValue = "all" | "unread" | "read";

const { data: alertsPage, isLoading, isError } = useAlertsQuery();
const markReadMutation = useMarkAlertReadMutation();
const deleteMutation = useDeleteAlertMutation();

const activeFilter = ref<FilterValue>("all");

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "unread", label: "Não lidos" },
  { value: "read", label: "Lidos" },
];

const allAlerts = computed<Alert[]>(() => alertsPage.value?.items ?? []);

const filteredAlerts = computed<Alert[]>(() => {
  if (activeFilter.value === "unread") {return allAlerts.value.filter((a) => a.readAt === null);}
  if (activeFilter.value === "read") {return allAlerts.value.filter((a) => a.readAt !== null);}
  return allAlerts.value;
});

const totalCount = computed(() => allAlerts.value.length);
const unreadCount = computed(() => allAlerts.value.filter((a) => a.readAt === null).length);
const readCount = computed(() => allAlerts.value.filter((a) => a.readAt !== null).length);

/**
 * Marks all unread alerts as read via the API.
 */
const onMarkAllRead = (): void => {
  const unread = allAlerts.value.filter((a) => a.readAt === null);
  unread.forEach((a) => markReadMutation.mutate(a.id));
};

/**
 * Marks a single alert as read by id.
 *
 * @param id - The alert id to mark as read.
 */
const onMarkRead = (id: string): void => {
  markReadMutation.mutate(id);
};

/**
 * Deletes a single alert by id.
 *
 * @param id - The alert id to delete.
 */
const onDelete = (id: string): void => {
  deleteMutation.mutate(id);
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

    <UiInlineError
      v-if="isError"
      title="Não foi possível carregar os alertas"
      message="Tente recarregar a página."
    />

    <template v-else>
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

      <UiPageLoader v-if="isLoading" :rows="4" />

      <template v-else-if="filteredAlerts.length === 0">
        <div class="alerts-page__empty-state">
          <span class="alerts-page__empty-text">
            Nenhum alerta encontrado para o filtro selecionado.
          </span>
        </div>
      </template>

      <div v-else class="alerts-page__list">
        <AlertItem
          v-for="alert in filteredAlerts"
          :key="alert.id"
          :alert="alert"
          @mark-read="onMarkRead"
          @delete="onDelete"
        />
      </div>
    </template>
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

.alerts-page__empty-state {
  padding: var(--space-4) 0;
  text-align: center;
}

.alerts-page__empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.alerts-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
