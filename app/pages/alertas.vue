<script setup lang="ts">
import { NTabs, NTabPane } from "naive-ui";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

import { useAlertsQuery } from "~/features/alerts/queries/use-alerts-query";
import { useAlertPreferencesQuery } from "~/features/alerts/queries/use-alert-preferences-query";
import { useAlertsClient } from "~/features/alerts/api/alerts.client";
import AlertsList from "~/features/alerts/components/AlertsList.vue";
import AlertPreferencesList from "~/features/alerts/components/AlertPreferencesList.vue";

definePageMeta({ middleware: ["authenticated"] });

const queryClient = useQueryClient();
const alertsClient = useAlertsClient();

const alertsQuery = useAlertsQuery();
const preferencesQuery = useAlertPreferencesQuery();

/** Tracks which categories are currently being updated. */
const updatingCategories = ref<Set<string>>(new Set());

/** Mutation to mark an alert as read. */
const markReadMutation = useMutation({
  mutationFn: (id: string) => alertsClient.markRead(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "list"] });
  },
});

/** Mutation to delete an alert. */
const deleteAlertMutation = useMutation({
  mutationFn: (id: string) => alertsClient.deleteAlert(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "list"] });
  },
});

/** Mutation to update an alert preference. */
const updatePreferenceMutation = useMutation({
  mutationFn: ({ category, enabled }: { category: string; enabled: boolean }) =>
    alertsClient.updatePreference(category, { enabled, channels: [] }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "preferences"] });
  },
});

/**
 * Handles marking an alert as read.
 *
 * @param id Alert identifier.
 */
const onMarkRead = (id: string): void => {
  markReadMutation.mutate(id);
};

/**
 * Handles deleting an alert.
 *
 * @param id Alert identifier.
 */
const onDeleteAlert = (id: string): void => {
  deleteAlertMutation.mutate(id);
};

/**
 * Handles toggling an alert preference.
 *
 * @param category Alert category identifier.
 * @param enabled New enabled state.
 */
const onTogglePreference = (category: string, enabled: boolean): void => {
  updatingCategories.value = new Set([...updatingCategories.value, category]);

  updatePreferenceMutation.mutate(
    { category, enabled },
    {
      onSettled: () => {
        const updated = new Set(updatingCategories.value);
        updated.delete(category);
        updatingCategories.value = updated;
      },
    },
  );
};
</script>

<template>
  <div class="alertas-page">
    <header class="alertas-page__header">
      <h1>Alertas</h1>
      <p class="alertas-page__subtitle">
        Gerencie seus alertas e configure suas preferências de notificação.
      </p>
    </header>

    <NTabs type="line" animated>
      <!-- Alerts tab -->
      <NTabPane name="alerts" tab="Alertas">
        <!-- Error state -->
        <UiBaseCard v-if="alertsQuery.isError.value" title="Erro ao carregar alertas">
          <p class="alertas-page__support-copy">
            Não foi possível carregar seus alertas. Tente novamente.
          </p>
        </UiBaseCard>

        <!-- Loading or loaded state -->
        <AlertsList
          v-else
          :alerts="alertsQuery.data.value?.items ?? []"
          :is-loading="alertsQuery.isLoading.value"
          @mark-read="onMarkRead"
          @delete="onDeleteAlert"
        />
      </NTabPane>

      <!-- Preferences tab -->
      <NTabPane name="preferences" tab="Preferências">
        <!-- Error state -->
        <UiBaseCard v-if="preferencesQuery.isError.value" title="Erro ao carregar preferências">
          <p class="alertas-page__support-copy">
            Não foi possível carregar suas preferências. Tente novamente.
          </p>
        </UiBaseCard>

        <!-- Loading or loaded state -->
        <AlertPreferencesList
          v-else
          :preferences="preferencesQuery.data.value ?? []"
          :is-loading="preferencesQuery.isLoading.value"
          :updating-categories="updatingCategories"
          @toggle="onTogglePreference"
        />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.alertas-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
}

.alertas-page__header {
  margin-bottom: var(--space-2, 8px);
}

.alertas-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.alertas-page__support-copy {
  margin: 0;
  color: var(--color-text-subtle, #888);
}
</style>
