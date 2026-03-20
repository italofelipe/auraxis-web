<script setup lang="ts">
import { NTabs, NTabPane } from "naive-ui";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

import { useAlertsQuery } from "~/features/alerts/queries/use-alerts-query";
import { useAlertPreferencesQuery } from "~/features/alerts/queries/use-alert-preferences-query";
import { useAlertsClient } from "~/features/alerts/api/alerts.client";
import AlertsList from "~/features/alerts/components/AlertsList.vue";
import AlertPreferencesList from "~/features/alerts/components/AlertPreferencesList.vue";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Alertas",
  pageSubtitle: "Alertas e preferências de notificação",
});

const queryClient = useQueryClient();
const alertsClient = useAlertsClient();

const alertsQuery = useAlertsQuery();
const preferencesQuery = useAlertPreferencesQuery();

const updatingCategories = ref<Set<string>>(new Set());

const markReadMutation = useMutation({
  mutationFn: (id: string) => alertsClient.markRead(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "list"] });
  },
});

const deleteAlertMutation = useMutation({
  mutationFn: (id: string) => alertsClient.deleteAlert(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "list"] });
  },
});

const updatePreferenceMutation = useMutation({
  mutationFn: ({ category, enabled }: { category: string; enabled: boolean }) =>
    alertsClient.updatePreference(category, { enabled, channels: [] }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts", "preferences"] });
  },
});

/** @param id Alert identifier. */
const onMarkRead = (id: string): void => {
  markReadMutation.mutate(id);
};

/** @param id Alert identifier. */
const onDeleteAlert = (id: string): void => {
  deleteAlertMutation.mutate(id);
};

/**
 * Toggles an alert preference and tracks the in-flight category
 * to prevent duplicate mutations while the request is pending.
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
    <NTabs type="line" animated>
      <NTabPane name="alerts" tab="Alertas">
        <UiBaseCard v-if="alertsQuery.isError.value" title="Erro ao carregar alertas">
          <p class="alertas-page__support-copy">
            Não foi possível carregar seus alertas. Tente novamente.
          </p>
        </UiBaseCard>

        <AlertsList
          v-else
          :alerts="alertsQuery.data.value?.items ?? []"
          :is-loading="alertsQuery.isLoading.value"
          @mark-read="onMarkRead"
          @delete="onDeleteAlert"
        />
      </NTabPane>

      <NTabPane name="preferences" tab="Preferências">
        <UiBaseCard v-if="preferencesQuery.isError.value" title="Erro ao carregar preferências">
          <p class="alertas-page__support-copy">
            Não foi possível carregar suas preferências. Tente novamente.
          </p>
        </UiBaseCard>

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
  gap: var(--space-4);
}

.alertas-page__support-copy {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
