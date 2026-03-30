<script setup lang="ts">
import { NButton, NTag } from "naive-ui";

import type { Invitation, InvitationStatus } from "~/features/sharing/model/sharing";

interface Props {
  /** Invitation data to display. */
  invitation: Invitation;
}

interface Emits {
  /** Emitted when the user clicks the revoke button. */
  (event: "revoke", id: string): void;
}

const { t } = useI18n();

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Maps an invitation status to a NaiveUI tag type.
 *
 * @param status Invitation status string.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (status: InvitationStatus): "default" | "success" | "error" | "warning" => {
  const map: Record<InvitationStatus, "default" | "success" | "error" | "warning"> = {
    pending: "warning",
    accepted: "success",
    revoked: "error",
    expired: "default",
  };
  return map[status] ?? "default";
};

/**
 * Maps an invitation status to a human-readable label in pt-BR.
 *
 * @param status Invitation status string.
 * @returns Human-readable status label.
 */
const statusLabel = (status: InvitationStatus): string => {
  const map: Record<InvitationStatus, string> = {
    pending: t("sharing.invitation.status.pending"),
    accepted: t("sharing.invitation.status.accepted"),
    revoked: t("sharing.invitation.status.revoked"),
    expired: t("sharing.invitation.status.expired"),
  };
  return map[status] ?? status;
};

/**
 * Formats an ISO date string to a localized pt-BR date.
 *
 * @param iso ISO date string.
 * @returns Formatted date string.
 */
const formatDate = (iso: string): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
};

/**
 * Handles the revoke action by emitting the revoke event.
 */
const handleRevoke = (): void => {
  emit("revoke", props.invitation.id);
};
</script>

<template>
  <div class="invitation-item">
    <div class="invitation-item__info">
      <span class="invitation-item__email">{{ invitation.inviteeEmail }}</span>
      <NTag
        :type="statusTagType(invitation.status)"
        size="small"
        round
        class="invitation-item__status"
      >
        {{ statusLabel(invitation.status) }}
      </NTag>
    </div>
    <span class="invitation-item__date">
      {{ $t('sharing.invitation.sentAt', { date: formatDate(invitation.createdAt) }) }}
    </span>
    <NButton
      v-if="invitation.status === 'pending'"
      type="error"
      size="small"
      class="invitation-item__revoke"
      @click="handleRevoke"
    >
      {{ $t('sharing.invitation.revoke') }}
    </NButton>
  </div>
</template>

<style scoped>
.invitation-item {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-radius: var(--border-radius-sm, var(--n-border-radius));
  background-color: var(--color-surface-raised, #fafafa);
  flex-wrap: wrap;
}

.invitation-item__info {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex: 1 1 auto;
}

.invitation-item__email {
  font-size: var(--font-size-body, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
}

.invitation-item__date {
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
}

.invitation-item__revoke {
  margin-left: auto;
}
</style>
