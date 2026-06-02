<script setup lang="ts">
import { computed } from "vue";
import { NCard, NSpin, NSwitch } from "naive-ui";

import { useToast } from "~/composables/useToast";
import { useNotificationPreferencesQuery } from "~/features/notifications/queries/use-notification-preferences-query";
import { useUpdateNotificationPreferencesMutation } from "~/features/notifications/queries/use-update-notification-preferences-mutation";
import {
  withDefaultCategories,
  type NotificationCategory,
  type NotificationPreference,
} from "~/features/notifications/model/notification-preferences";

const { t } = useI18n();
const toast = useToast();

const query = useNotificationPreferencesQuery();
const mutation = useUpdateNotificationPreferencesMutation();

const preferences = computed<NotificationPreference[]>(() =>
  withDefaultCategories(query.data.value ?? []),
);

const isGloballyPaused = computed<boolean>(() =>
  preferences.value.some((p) => p.globalOptOut),
);

const isBusy = computed<boolean>(() => query.isLoading.value || mutation.isPending.value);

/**
 * Persists a batch of preferences, surfacing success/error via toast.
 *
 * @param next Preferences to upsert.
 */
async function persist(next: NotificationPreference[]): Promise<void> {
  try {
    await mutation.mutateAsync(next);
    toast.success(t("notificationPreferences.saved"));
  } catch {
    toast.error(t("notificationPreferences.error"));
  }
}

/**
 * Toggles a single category's enabled flag.
 *
 * @param category Category to update.
 * @param enabled Desired enabled state.
 */
async function onToggleCategory(
  category: NotificationCategory,
  enabled: boolean,
): Promise<void> {
  await persist([{ category, enabled, globalOptOut: isGloballyPaused.value }]);
}

/**
 * Toggles the global opt-out across every category.
 *
 * @param paused Whether all notifications should be paused.
 */
async function onToggleGlobal(paused: boolean): Promise<void> {
  await persist(
    preferences.value.map((p) => ({ ...p, globalOptOut: paused })),
  );
}
</script>

<template>
  <NCard :bordered="true" class="notification-preferences" data-testid="notification-preferences">
    <div class="notification-preferences__head">
      <h3>{{ t("notificationPreferences.title") }}</h3>
      <p>{{ t("notificationPreferences.description") }}</p>
    </div>

    <div class="notification-preferences__global">
      <span>{{ t("notificationPreferences.globalOptOut") }}</span>
      <NSpin v-if="isBusy" :size="16" />
      <NSwitch
        v-else
        :value="isGloballyPaused"
        data-testid="global-opt-out"
        @update:value="onToggleGlobal"
      />
    </div>

    <ul class="notification-preferences__list">
      <li
        v-for="pref in preferences"
        :key="pref.category"
        class="notification-preferences__item"
      >
        <span>{{ t(`notificationPreferences.categories.${pref.category}`) }}</span>
        <NSwitch
          :value="pref.enabled"
          :disabled="isGloballyPaused || isBusy"
          :data-testid="`pref-${pref.category}`"
          @update:value="(v: boolean) => onToggleCategory(pref.category, v)"
        />
      </li>
    </ul>
  </NCard>
</template>

<style scoped>
.notification-preferences {
  border-radius: var(--radius-xl);
}

.notification-preferences__head h3 {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.notification-preferences__head p {
  margin: 0 0 var(--space-3);
  color: var(--color-text-secondary);
}

.notification-preferences__global {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-block: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
  border-bottom: 1px solid var(--color-outline-soft);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.notification-preferences__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notification-preferences__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-block: var(--space-2);
  color: var(--color-text-secondary);
}

.notification-preferences__item + .notification-preferences__item {
  border-top: 1px solid var(--color-outline-soft);
}
</style>
