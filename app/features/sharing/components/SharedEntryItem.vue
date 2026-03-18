<script setup lang="ts">
import { NButton, NTag } from "naive-ui";

import type { SharePermission, SharedEntry } from "~/features/sharing/model/sharing";

interface Props {
  /** Shared entry data to display. */
  entry: SharedEntry;
}

interface Emits {
  /** Emitted when the user clicks the revoke button. */
  (event: "revoke", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Maps a share permission to a NaiveUI tag type.
 *
 * @param permission Share permission value.
 * @returns NaiveUI tag type string.
 */
const permissionTagType = (permission: SharePermission): "info" | "success" => {
  return permission === "write" ? "success" : "info";
};

/**
 * Maps a share permission to a human-readable label in pt-BR.
 *
 * @param permission Share permission value.
 * @returns Human-readable permission label.
 */
const permissionLabel = (permission: SharePermission): string => {
  const map: Record<SharePermission, string> = {
    read: "Leitura",
    write: "Escrita",
  };
  return map[permission] ?? permission;
};

/**
 * Handles the revoke action by emitting the revoke event.
 */
const handleRevoke = (): void => {
  emit("revoke", props.entry.id);
};
</script>

<template>
  <div class="shared-entry-item">
    <div class="shared-entry-item__info">
      <span class="shared-entry-item__type">{{ entry.entryType }}</span>
      <NTag
        :type="permissionTagType(entry.permission)"
        size="small"
        round
        class="shared-entry-item__permission"
      >
        {{ permissionLabel(entry.permission) }}
      </NTag>
      <NTag
        v-if="entry.revokedAt"
        type="error"
        size="small"
        round
      >
        Revogado
      </NTag>
    </div>
    <NButton
      v-if="!entry.revokedAt"
      type="error"
      size="small"
      class="shared-entry-item__revoke"
      @click="handleRevoke"
    >
      Revogar
    </NButton>
  </div>
</template>

<style scoped>
.shared-entry-item {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-radius: var(--border-radius-sm, var(--n-border-radius));
  background-color: var(--color-surface-raised, #fafafa);
  flex-wrap: wrap;
}

.shared-entry-item__info {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex: 1 1 auto;
}

.shared-entry-item__type {
  font-size: var(--font-size-body, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  text-transform: capitalize;
}

.shared-entry-item__revoke {
  margin-left: auto;
}
</style>
