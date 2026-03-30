<script setup lang="ts">
import { NCard, NTag, NText, NStatistic, NButton } from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { SharedEntryRowProps, SharedEntryRowEmits } from "./SharedEntryRow.types";
import type { SplitType } from "~/features/shared-entries/contracts/shared-entry.dto";

const { t } = useI18n();

const props = defineProps<SharedEntryRowProps>();
const emit = defineEmits<SharedEntryRowEmits>();

/**
 * Resolves the NaiveUI tag type for a given entry status.
 *
 * @param status - The shared entry status.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  status: "pending" | "accepted" | "declined",
): "warning" | "success" | "error" => {
  const map: Record<"pending" | "accepted" | "declined", "warning" | "success" | "error"> = {
    pending: "warning",
    accepted: "success",
    declined: "error",
  };
  return map[status];
};

/**
 * Resolves a human-readable label for a given entry status.
 *
 * @param status - The shared entry status.
 * @returns Localised label string in PT-BR.
 */
const statusLabel = (status: "pending" | "accepted" | "declined"): string => {
  const map: Record<"pending" | "accepted" | "declined", string> = {
    pending: t("sharing.sharedEntryRow.status.pending"),
    accepted: t("sharing.sharedEntryRow.status.accepted"),
    declined: t("sharing.sharedEntryRow.status.declined"),
  };
  return map[status];
};

/**
 * Resolves the NaiveUI tag type for a given split type.
 *
 * @param splitType - The split type value.
 * @returns NaiveUI tag type string.
 */
const splitTagType = (splitType: SplitType): "default" | "info" | "success" => {
  const map: Record<SplitType, "default" | "info" | "success"> = {
    equal: "default",
    custom: "info",
    percentage: "success",
  };
  return map[splitType];
};

/**
 * Resolves a human-readable label for a given split type.
 *
 * @param splitType - The split type value.
 * @returns Localised label string in PT-BR.
 */
const splitLabel = (splitType: SplitType): string => {
  const map: Record<SplitType, string> = {
    equal: t("sharing.sharedEntryRow.splitType.equal"),
    custom: t("sharing.sharedEntryRow.splitType.custom"),
    percentage: t("sharing.sharedEntryRow.splitType.percentage"),
  };
  return map[splitType];
};

/**
 * Formats an ISO date string to a localised PT-BR short date.
 *
 * @param value - ISO date string.
 * @returns Formatted date string like "31/12/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const showRevokeButton = computed(
  () => props.mode === "by-me" && props.entry.status === "pending",
);

/** Handles the revoke button click. */
const onRevoke = (): void => {
  emit("revoke", props.entry.id);
};
</script>

<template>
  <NCard
    :bordered="true"
    class="shared-entry-row"
    content-style="padding: var(--space-3);"
  >
    <div class="shared-entry-row__content">
      <div class="shared-entry-row__header">
        <NText strong class="shared-entry-row__title">
          {{ entry.transaction_title }}
        </NText>
        <div class="shared-entry-row__tags">
          <NTag :type="statusTagType(entry.status)" size="small" :bordered="false">
            {{ statusLabel(entry.status) }}
          </NTag>
          <NTag :type="splitTagType(entry.split_type)" size="small" :bordered="false">
            {{ splitLabel(entry.split_type) }}
          </NTag>
        </div>
      </div>

      <NText class="shared-entry-row__email" depth="3">
        {{ $t('sharing.sharedEntryRow.email') }} {{ entry.other_party_email }}
      </NText>

      <div class="shared-entry-row__amounts">
        <NStatistic
          :label="$t('sharing.sharedEntryRow.myShare')"
          :value="formatCurrency(entry.my_share)"
          class="shared-entry-row__stat"
        />
        <NStatistic
          :label="$t('sharing.sharedEntryRow.total')"
          :value="formatCurrency(entry.transaction_amount)"
          class="shared-entry-row__stat"
        />
      </div>

      <div class="shared-entry-row__footer">
        <NText class="shared-entry-row__date" depth="3">
          {{ formatDate(entry.created_at) }}
        </NText>
        <NButton
          v-if="showRevokeButton"
          size="small"
          quaternary
          @click="onRevoke"
        >
          {{ $t('sharing.sharedEntryRow.revoke') }}
        </NButton>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.shared-entry-row {
  background: var(--color-bg-elevated);
}

.shared-entry-row__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shared-entry-row__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.shared-entry-row__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1 1 auto;
  min-width: 0;
}

.shared-entry-row__tags {
  display: flex;
  gap: var(--space-1, 4px);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.shared-entry-row__email {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.shared-entry-row__amounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.shared-entry-row__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}

.shared-entry-row__date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
