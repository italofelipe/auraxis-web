<script setup lang="ts">
import { NButton, NTag } from "naive-ui";
import { Info, AlertTriangle, XCircle } from "lucide-vue-next";

import type { Alert, AlertSeverity } from "~/features/alerts/model/alerts";

interface Props {
  /** Alert data to display. */
  alert: Alert;
}

interface Emits {
  /** Emitted when the user clicks the mark-as-read or delete button. */
  (event: "mark-read" | "delete", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Resolves the NaiveUI tag type based on alert severity.
 *
 * @param severity Alert severity level.
 * @returns NaiveUI tag type string.
 */
const severityTagType = (severity: AlertSeverity): "info" | "warning" | "error" => {
  if (severity === "critical") { return "error"; }
  if (severity === "warning") { return "warning"; }
  return "info";
};

/**
 * Resolves the severity label for display.
 *
 * @param severity Alert severity level.
 * @returns Human-readable severity label in PT-BR.
 */
const severityLabel = (severity: AlertSeverity): string => {
  if (severity === "critical") { return "Crítico"; }
  if (severity === "warning") { return "Atenção"; }
  return "Info";
};

/**
 * Formats the createdAt ISO timestamp into a human-readable PT-BR date label.
 *
 * @returns Localized date/time string.
 */
const createdAtLabel = computed((): string => {
  if (!props.alert.createdAt) { return ""; }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(props.alert.createdAt));
});

/**
 * Handles the mark-as-read button click.
 */
const onMarkRead = (): void => {
  emit("mark-read", props.alert.id);
};

/**
 * Handles the delete button click.
 */
const onDelete = (): void => {
  emit("delete", props.alert.id);
};
</script>

<template>
  <div
    class="alert-item"
    :class="{ 'alert-item--read': alert.readAt !== null }"
    :data-severity="alert.severity"
  >
    <div class="alert-item__icon">
      <Info v-if="alert.severity === 'info'" :size="20" class="alert-item__icon--info" />
      <AlertTriangle v-else-if="alert.severity === 'warning'" :size="20" class="alert-item__icon--warning" />
      <XCircle v-else :size="20" class="alert-item__icon--critical" />
    </div>

    <div class="alert-item__content">
      <div class="alert-item__header">
        <span class="alert-item__title">{{ alert.title }}</span>
        <NTag
          :type="severityTagType(alert.severity)"
          size="small"
          round
          class="alert-item__severity-badge"
        >
          {{ severityLabel(alert.severity) }}
        </NTag>
      </div>

      <p class="alert-item__body">{{ alert.body }}</p>

      <span v-if="createdAtLabel" class="alert-item__date">{{ createdAtLabel }}</span>
    </div>

    <div class="alert-item__actions">
      <NButton
        v-if="!alert.readAt"
        size="small"
        type="default"
        class="alert-item__mark-read-btn"
        @click="onMarkRead"
      >
        Marcar como lido
      </NButton>

      <NButton
        size="small"
        type="error"
        class="alert-item__delete-btn"
        @click="onDelete"
      >
        Excluir
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) 0;
  border-bottom: 1px solid var(--color-outline-subtle, #eee);
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item--read {
  opacity: 0.6;
}

.alert-item__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-item__icon--info {
  color: var(--color-info, #2080f0);
}

.alert-item__icon--warning {
  color: var(--color-warning, #f0a020);
}

.alert-item__icon--critical {
  color: var(--color-error, #d03050);
}

.alert-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.alert-item__header {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex-wrap: wrap;
  margin-bottom: var(--space-1, 4px);
}

.alert-item__title {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-primary);
}

.alert-item__severity-badge {
  flex-shrink: 0;
}

.alert-item__body {
  margin: 0 0 var(--space-1, 4px);
  color: var(--color-text-subtle, #888);
  font-size: var(--font-size-body-sm, 0.875rem);
}

.alert-item__date {
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #aaa);
}

.alert-item__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
  flex-shrink: 0;
}
</style>
