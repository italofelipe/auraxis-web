<script setup lang="ts">
import { computed } from "vue";
import { NCard, NSwitch, NAlert, NButton, NSpin } from "naive-ui";
import { Bell } from "lucide-vue-next";

import { usePushSubscription } from "~/features/notifications/composables/usePushSubscription";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Notificações",
  pageSubtitle: "Configure lembretes via push",
});

useHead({ title: "Notificações | Auraxis" });

const { t } = useI18n();

const {
  state,
  isSubscribed,
  isBusy,
  permission,
  error,
  subscribe,
  unsubscribe,
} = usePushSubscription();

const isUnsupported = computed<boolean>(() => state.value === "unsupported");
const isUnconfigured = computed<boolean>(() => state.value === "unconfigured");
const isPermissionDenied = computed<boolean>(() => permission.value === "denied");
const canToggle = computed<boolean>(
  () => !isUnsupported.value && !isUnconfigured.value && !isPermissionDenied.value,
);

/**
 * Handles user interaction with the opt-in switch.
 *
 * @param value - Desired switch state after the click.
 */
const onToggle = async (value: boolean): Promise<void> => {
  if (value) {
    await subscribe();
  } else {
    await unsubscribe();
  }
};
</script>

<template>
  <div class="notifications-page">
    <NCard :bordered="true" class="notifications-page__card">
      <div class="notifications-page__header">
        <Bell :size="20" aria-hidden="true" />
        <div class="notifications-page__title-block">
          <h2 class="notifications-page__title">{{ t('pages.settings.notifications.title') }}</h2>
          <p class="notifications-page__subtitle">
            {{ t('pages.settings.notifications.subtitle') }}
          </p>
        </div>
      </div>

      <NAlert
        v-if="isUnsupported"
        type="warning"
        :title="t('pages.settings.notifications.unsupportedTitle')"
        class="notifications-page__alert"
      >
        {{ t('pages.settings.notifications.unsupportedDescription') }}
      </NAlert>

      <NAlert
        v-else-if="isUnconfigured"
        type="info"
        :title="t('pages.settings.notifications.unconfiguredTitle')"
        class="notifications-page__alert"
      >
        {{ t('pages.settings.notifications.unconfiguredDescription') }}
      </NAlert>

      <NAlert
        v-else-if="isPermissionDenied"
        type="error"
        :title="t('pages.settings.notifications.deniedTitle')"
        class="notifications-page__alert"
      >
        {{ t('pages.settings.notifications.deniedDescription') }}
      </NAlert>

      <div class="notifications-page__toggle-row">
        <div class="notifications-page__toggle-labels">
          <span class="notifications-page__toggle-title">
            {{ t('pages.settings.notifications.toggleTitle') }}
          </span>
          <span class="notifications-page__toggle-help">
            {{ t('pages.settings.notifications.toggleHelp') }}
          </span>
        </div>
        <div class="notifications-page__toggle-control">
          <NSpin v-if="isBusy" :size="18" />
          <NSwitch
            v-else
            :value="isSubscribed"
            :disabled="!canToggle"
            @update:value="onToggle"
          />
        </div>
      </div>

      <NAlert v-if="error" type="error" class="notifications-page__alert">
        {{ error }}
      </NAlert>

      <div class="notifications-page__actions">
        <NButton size="small" quaternary tag="a" href="/subscription">
          {{ t('pages.settings.notifications.managePreferences') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.notifications-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.notifications-page__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.notifications-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notifications-page__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.notifications-page__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.notifications-page__alert {
  margin-bottom: var(--space-2);
}

.notifications-page__toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
  border-bottom: 1px solid var(--color-outline-soft);
}

.notifications-page__toggle-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notifications-page__toggle-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.notifications-page__toggle-help {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.notifications-page__toggle-control {
  display: flex;
  align-items: center;
}

.notifications-page__actions {
  margin-top: var(--space-2);
  display: flex;
  justify-content: flex-end;
}
</style>
