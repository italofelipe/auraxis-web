<script setup lang="ts">
import { NCard, NEmpty, NSkeleton, NSpace } from "naive-ui";

import AlertItem from "~/features/alerts/components/AlertItem.vue";
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
  <NCard title="Alertas">
    <!-- Loading skeletons -->
    <NSpace v-if="isLoading" vertical :size="12">
      <NSkeleton v-for="n in 3" :key="n" height="72px" :sharp="false" />
    </NSpace>

    <!-- Empty state -->
    <NEmpty
      v-else-if="alerts.length === 0"
      description="Nenhum alerta encontrado. Você está em dia!"
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
