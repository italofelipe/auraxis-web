<script setup lang="ts">
import { NCard, NTag, NText, NButton } from "naive-ui";
import { CheckIcon, Trash2Icon } from "lucide-vue-next";
import type { AlertItemProps, AlertItemEmits } from "./AlertItem.types";
import type { AlertType } from "~/features/alerts/contracts/alert.dto";

const props = defineProps<AlertItemProps>();
const emit = defineEmits<AlertItemEmits>();

/** True when the alert has not been read yet. */
const isUnread = computed<boolean>(() => props.alert.readAt === null);

/**
 * Resolves the NaiveUI tag type for a given alert type string.
 * Falls back to "default" for unrecognised types.
 *
 * @param type - The alert type value.
 * @returns NaiveUI tag type string.
 */
const alertTagType = (
  type: string,
): "success" | "error" | "warning" | "info" | "default" => {
  const map: Record<AlertType, "success" | "error" | "warning" | "info" | "default"> = {
    goal_achieved: "success",
    overdue_payment: "error",
    budget_exceeded: "warning",
    investment_opportunity: "info",
    system: "default",
  };
  return (map as Record<string, "success" | "error" | "warning" | "info" | "default">)[type] ?? "default";
};

/**
 * Resolves a human-readable label for a given alert type string.
 * Falls back to the raw type value for unrecognised types.
 *
 * @param type - The alert type value.
 * @returns Localised label string in PT-BR.
 */
const alertTypeLabel = (type: string): string => {
  const map: Record<AlertType, string> = {
    goal_achieved: "Meta atingida",
    overdue_payment: "Pagamento atrasado",
    budget_exceeded: "Orçamento excedido",
    investment_opportunity: "Oportunidade",
    system: "Sistema",
  };
  return (map as Record<string, string>)[type] ?? type;
};

/**
 * Formats a past ISO timestamp as a relative time string in PT-BR.
 *
 * @param isoDate - ISO date string.
 * @returns Relative time string like "2 horas atrás" or "3 dias atrás".
 */
const relativeTime = (isoDate: string): string => {
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffDays) >= 1) {return rtf.format(diffDays, "day");}
  if (Math.abs(diffHours) >= 1) {return rtf.format(diffHours, "hour");}
  if (Math.abs(diffMinutes) >= 1) {return rtf.format(diffMinutes, "minute");}
  return rtf.format(diffSeconds, "second");
};

/** Handles the mark-as-read button click. */
const onMarkRead = (): void => {
  emit("mark-read", props.alert.id);
};

/** Handles the delete button click. */
const onDelete = (): void => {
  emit("delete", props.alert.id);
};
</script>

<template>
  <NCard
    :bordered="true"
    class="alert-item"
    :class="{ 'alert-item--unread': isUnread }"
    content-style="padding: var(--space-3);"
  >
    <div class="alert-item__row">
      <div class="alert-item__content">
        <div class="alert-item__header">
          <NText :strong="isUnread" class="alert-item__title">
            {{ alert.title }}
          </NText>
          <NTag :type="alertTagType(alert.type)" size="small" :bordered="false">
            {{ alertTypeLabel(alert.type) }}
          </NTag>
        </div>
        <NText class="alert-item__description" depth="3">
          {{ alert.body }}
        </NText>
        <NText class="alert-item__timestamp" depth="3">
          {{ relativeTime(alert.createdAt) }}
        </NText>
      </div>
      <div class="alert-item__actions">
        <NButton
          v-if="isUnread"
          size="small"
          quaternary
          :focusable="false"
          aria-label="Marcar como lido"
          @click="onMarkRead"
        >
          <template #icon>
            <CheckIcon :size="16" />
          </template>
        </NButton>
        <NButton
          size="small"
          quaternary
          :focusable="false"
          aria-label="Excluir alerta"
          @click="onDelete"
        >
          <template #icon>
            <Trash2Icon :size="16" />
          </template>
        </NButton>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.alert-item {
  background: var(--color-bg-elevated);
  border-left: 4px solid transparent;
  transition: border-color 0.15s ease;
}

.alert-item--unread {
  border-left: 4px solid var(--color-brand-600);
}

.alert-item__row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.alert-item__content {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-item__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.alert-item__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  flex: 1 1 auto;
  min-width: 0;
}

.alert-item__description {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.alert-item__timestamp {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.alert-item__actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-shrink: 0;
  align-items: flex-start;
}
</style>
