<script setup lang="ts">
import { NCard, NEmpty, NSpace } from "naive-ui";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";

import type { Alert } from "~/features/alerts/model/alerts";


interface Props {
  /** List of alerts to display. */
  alerts: Alert[];
  /** Whether the alerts list is loading. */
  isLoading?: boolean;
}

interface Emits {
  /** Emitted when the user marks an alert as read or deletes it. */
  (event: "mark-read" | "delete", id: string): void;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<Emits>();

/**
 * Forwards the mark-read event from a child AlertItem.
 *
 * @param id Alert identifier.
 */
const onMarkRead = (id: string): void => {
  emit("mark-read", id);
};

/**
 * Forwards the delete event from a child AlertItem.
 *
 * @param id Alert identifier.
 */
const onDelete = (id: string): void => {
  emit("delete", id);
};
</script>

<template>
  <NCard :title="$t('alert.list.title')">
    <!-- Loading skeletons -->
    <NSpace v-if="isLoading" vertical :size="12">
      <BaseSkeleton :repeat="3" height="72px" />
    </NSpace>

    <!-- Empty state -->
    <NEmpty
      v-else-if="alerts.length === 0"
      :description="$t('alert.list.empty')"
    />

    <!-- Alerts list -->
    <ul v-else class="alerts-list">
      <li v-for="alert in alerts" :key="alert.id" class="alerts-list__item">
        <AlertItem
          :alert="alert"
          @mark-read="onMarkRead"
          @delete="onDelete"
        />
      </li>
    </ul>
  </NCard>
</template>

<style scoped>
.alerts-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.alerts-list__item {
  display: contents;
}
</style>
