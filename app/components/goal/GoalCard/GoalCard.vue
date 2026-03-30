<script setup lang="ts">
import {
  NCard,
  NTag,
  NProgress,
  NStatistic,
  NButton,
  NSkeleton,
} from "naive-ui";
import { formatCurrency } from "~/utils/currency";
import type { GoalCardProps } from "./GoalCard.types";
import type { GoalStatus } from "~/features/goals/contracts/goal.dto";

const { t } = useI18n();

const props = defineProps<GoalCardProps>();

/**
 * Resolves the NaiveUI tag type for a given goal status.
 *
 * @param status - The goal status value.
 * @returns NaiveUI tag type string.
 */
const statusTagType = (
  status: GoalStatus,
): "success" | "warning" | "info" | "error" => {
  const map: Record<GoalStatus, "success" | "warning" | "info" | "error"> = {
    completed: "success",
    paused: "warning",
    active: "info",
    cancelled: "error",
  };
  return map[status];
};

/**
 * Resolves the NaiveUI progress color for a given goal status.
 *
 * @param status - The goal status value.
 * @returns CSS color string for the progress rail.
 */
const progressColor = (status: GoalStatus): string => {
  const map: Record<GoalStatus, string> = {
    completed: "var(--color-success)",
    paused: "var(--color-warning)",
    active: "var(--color-brand-600)",
    cancelled: "var(--color-error)",
  };
  return map[status];
};

/**
 * Returns a translated label for a goal status.
 *
 * @param status - The goal status value.
 * @returns Localised label string.
 */
const statusLabel = (status: GoalStatus): string => {
  const map: Record<GoalStatus, string> = {
    active: t("goal.status.active"),
    completed: t("goal.status.completed"),
    paused: t("goal.status.paused"),
    cancelled: t("goal.status.cancelled"),
  };
  return map[status];
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to a localised short date.
 *
 * @param value - ISO date string.
 * @returns Formatted date string like "31/12/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const progressPercent = computed(() => {
  if (props.goal.target_amount === 0) {return 0;}
  return Math.min(
    Math.round((props.goal.current_amount / props.goal.target_amount) * 100),
    100,
  );
});
</script>

<template>
  <NCard
    :bordered="true"
    class="goal-card"
    content-style="padding: var(--space-3);"
  >
    <template v-if="props.loading">
      <NSkeleton height="20px" width="60%" :sharp="false" />
      <NSkeleton height="14px" width="40%" :sharp="false" style="margin-top: 8px;" />
      <NSkeleton height="8px" :sharp="false" style="margin-top: 12px;" />
      <NSkeleton height="40px" :sharp="false" style="margin-top: 12px;" />
    </template>

    <template v-else>
      <div class="goal-card__header">
        <span class="goal-card__name">{{ props.goal.name }}</span>
        <NTag :type="statusTagType(props.goal.status)" size="small" :bordered="false">
          {{ statusLabel(props.goal.status) }}
        </NTag>
      </div>

      <p v-if="props.goal.description" class="goal-card__description">
        {{ props.goal.description }}
      </p>

      <div class="goal-card__progress-section">
        <div class="goal-card__progress-header">
          <span class="goal-card__progress-label">{{ $t('goal.card.progress') }}</span>
          <span class="goal-card__progress-pct">{{ progressPercent }}%</span>
        </div>
        <NProgress
          type="line"
          :percentage="progressPercent"
          :color="progressColor(props.goal.status)"
          :show-indicator="false"
          :height="8"
          :border-radius="4"
        />
      </div>

      <div class="goal-card__stats">
        <NStatistic
          :label="$t('goal.card.accumulated')"
          :value="formatCurrency(props.goal.current_amount)"
          class="goal-card__stat"
        />
        <NStatistic
          :label="$t('goal.card.target')"
          :value="formatCurrency(props.goal.target_amount)"
          class="goal-card__stat"
        />
      </div>

      <div class="goal-card__footer">
        <span class="goal-card__target-date">
          {{ $t('goal.card.targetDate') }} {{ formatDate(props.goal.target_date) }}
        </span>
        <NButton size="small" quaternary>{{ $t('goal.card.viewDetails') }}</NButton>
      </div>
    </template>
  </NCard>
</template>

<style scoped>
.goal-card {
  background: var(--color-bg-elevated);
}

.goal-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.goal-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.4;
  flex: 1 1 auto;
}

.goal-card__description {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goal-card__progress-section {
  margin-bottom: var(--space-3);
}

.goal-card__progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.goal-card__progress-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.goal-card__progress-pct {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goal-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.goal-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}

.goal-card__target-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
