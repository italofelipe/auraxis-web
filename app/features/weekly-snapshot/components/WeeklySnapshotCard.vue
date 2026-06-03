<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { NButton, NCard, NSkeleton, NTag } from "naive-ui";
import { CalendarRange, Lock, Sparkles } from "lucide-vue-next";

import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useWeeklySnapshotQuery } from "~/features/weekly-snapshot/queries/use-weekly-snapshot-query";
import {
  WEEKLY_SNAPSHOT_SEEN_KEY,
  buildSnapshotSignature,
  isSnapshotUnseen,
} from "~/features/weekly-snapshot/model/weekly-snapshot";
import UiMetricCard from "~/components/ui/UiMetricCard/UiMetricCard.vue";
import UiInlineError from "~/components/ui/UiInlineError/UiInlineError.vue";

const { t, n } = useI18n();

const entitlement = useEntitlementQuery("advanced_simulations");
const hasPremium = computed<boolean>(() => entitlement.data.value === true);

const snapshotQuery = useWeeklySnapshotQuery(undefined, { enabled: hasPremium });
const snapshot = computed(() => snapshotQuery.data.value ?? null);

const lastSeen = ref<string | null>(null);

onMounted(() => {
  if (typeof window === "undefined") {
    return;
  }
  lastSeen.value = window.localStorage.getItem(WEEKLY_SNAPSHOT_SEEN_KEY);
});

const isUnseen = computed<boolean>(() => {
  if (!snapshot.value) {
    return false;
  }
  return isSnapshotUnseen(snapshot.value, lastSeen.value);
});

/**
 * Persists the current snapshot signature so the "NOVO" badge clears.
 */
function markAsSeen(): void {
  if (typeof window === "undefined" || !snapshot.value) {
    return;
  }
  const signature = buildSnapshotSignature(snapshot.value);
  window.localStorage.setItem(WEEKLY_SNAPSHOT_SEEN_KEY, signature);
  lastSeen.value = signature;
}

/**
 * @param value Numeric amount.
 * @returns BRL-formatted string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

const isLoading = computed<boolean>(() => hasPremium.value && snapshotQuery.isLoading.value);
const isError = computed<boolean>(() => hasPremium.value && snapshotQuery.isError.value);
/** True once the scheduled batch has generated a narrative for this week. */
const hasNarrative = computed<boolean>(() => Boolean(snapshot.value?.narrative?.trim()));
</script>

<template>
  <NCard :bordered="true" class="weekly-snapshot-card" data-testid="weekly-snapshot-card">
    <template #header>
      <span class="weekly-snapshot-card__header">
        <CalendarRange :size="18" aria-hidden="true" />
        {{ t("weeklySnapshot.title") }}
        <NTag v-if="isUnseen && hasNarrative" type="success" size="small" round data-testid="weekly-snapshot-new-badge">
          {{ t("weeklySnapshot.newBadge") }}
        </NTag>
      </span>
    </template>

    <!-- Free users: premium teaser -->
    <div v-if="!hasPremium" class="weekly-snapshot-card__locked" data-testid="weekly-snapshot-locked">
      <Lock :size="20" aria-hidden="true" />
      <p class="weekly-snapshot-card__locked-title">{{ t("weeklySnapshot.locked.title") }}</p>
      <p class="weekly-snapshot-card__locked-desc">{{ t("weeklySnapshot.locked.description") }}</p>
      <NButton type="primary" tag="a" href="/subscription" size="small">
        {{ t("weeklySnapshot.locked.cta") }}
      </NButton>
    </div>

    <!-- Premium loading -->
    <div v-else-if="isLoading" data-testid="weekly-snapshot-loading">
      <NSkeleton text :repeat="3" />
    </div>

    <!-- Premium error -->
    <UiInlineError
      v-else-if="isError"
      :message="t('weeklySnapshot.error')"
      data-testid="weekly-snapshot-error"
    />

    <!-- Premium data -->
    <div v-else-if="snapshot" class="weekly-snapshot-card__body">
      <p
        v-if="hasNarrative"
        class="weekly-snapshot-card__narrative"
      >
        <Sparkles :size="16" aria-hidden="true" />
        {{ snapshot.narrative }}
      </p>
      <p
        v-else
        class="weekly-snapshot-card__pending"
        data-testid="weekly-snapshot-pending"
      >
        <Sparkles :size="16" aria-hidden="true" />
        {{ t("weeklySnapshot.pending") }}
      </p>

      <div class="weekly-snapshot-card__metrics">
        <UiMetricCard :label="t('weeklySnapshot.metrics.expense')" :value="formatBrl(snapshot.currentExpense)" :trend="snapshot.expenseDeltaPercent" />
        <UiMetricCard :label="t('weeklySnapshot.metrics.balance')" :value="formatBrl(snapshot.currentBalance)" :trend="snapshot.balanceDeltaPercent" />
        <UiMetricCard :label="t('weeklySnapshot.metrics.transactions')" :value="String(snapshot.transactionCount)" />
      </div>

      <div v-if="isUnseen && hasNarrative" class="weekly-snapshot-card__actions">
        <NButton size="tiny" quaternary data-testid="weekly-snapshot-mark-seen" @click="markAsSeen">
          {{ t("weeklySnapshot.markSeen") }}
        </NButton>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.weekly-snapshot-card {
  border-radius: var(--radius-xl);
}

.weekly-snapshot-card__header {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.weekly-snapshot-card__locked {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.weekly-snapshot-card__locked-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.weekly-snapshot-card__locked-desc {
  margin: 0;
  color: var(--color-text-secondary);
}

.weekly-snapshot-card__body {
  display: grid;
  gap: var(--space-3);
}

.weekly-snapshot-card__narrative {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.weekly-snapshot-card__pending {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.weekly-snapshot-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.weekly-snapshot-card__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .weekly-snapshot-card__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
