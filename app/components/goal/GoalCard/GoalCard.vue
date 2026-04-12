<script setup lang="ts">
import {
  NCard,
  NTag,
  NProgress,
  NStatistic,
  NButton,
  NPopconfirm,
  NSpace,
} from "naive-ui";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { formatCurrency } from "~/utils/currency";
import type { GoalCardProps } from "./GoalCard.types";
import type { GoalDto, GoalStatus } from "~/features/goals/contracts/goal.dto";

type HealthStatus = "completed" | "at_risk" | "off_track" | "on_track" | "unknown";

const { t } = useI18n();

const props = defineProps<GoalCardProps>();

const emit = defineEmits<{
  edit: [];
  "show-plan": [];
  delete: [];
}>();

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
 * @param value - ISO date string or null/undefined.
 * @returns Formatted date string like "31/12/2026", or "Sem prazo" when absent.
 */
const formatDate = (value: string | null | undefined): string => {
  if (!value) { return t("goal.card.noDeadline"); }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const progressPercent = computed(() => {
  if (props.goal.target_amount === 0) { return 0; }
  return Math.min(
    Math.round((props.goal.current_amount / props.goal.target_amount) * 100),
    100,
  );
});

/**
 * Derives a health status from the goal's progress and deadline proximity.
 *
 * @param goal - The goal to evaluate.
 * @returns Health status label.
 */
function deriveHealthStatus(goal: GoalDto): HealthStatus {
  if (goal.status === "completed" || (goal.target_amount > 0 && goal.current_amount >= goal.target_amount)) {
    return "completed";
  }
  if (goal.status !== "active") { return "unknown"; }
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  if (goal.target_date) {
    const daysLeft = Math.floor((new Date(`${goal.target_date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 30 && progress < 100) { return "at_risk"; }
    if (daysLeft < 180 && progress < 50) { return "off_track"; }
  }
  return "on_track";
}

const healthStatus = computed((): HealthStatus => deriveHealthStatus(props.goal));

const healthLabel = computed((): string => {
  const keyMap: Record<HealthStatus, string> = {
    completed: "goal.health.completed",
    on_track: "goal.health.on_track",
    off_track: "goal.health.off_track",
    at_risk: "goal.health.at_risk",
    unknown: "goal.health.unknown",
  };
  return t(keyMap[healthStatus.value]);
});
</script>

<template>
  <NCard
    :bordered="true"
    class="goal-card"
    content-style="padding: var(--space-3);"
  >
    <template v-if="props.loading">
      <BaseSkeleton height="20px" width="60%" />
      <BaseSkeleton height="14px" width="40%" />
      <BaseSkeleton height="8px" />
      <BaseSkeleton height="40px" />
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
        <span class="goal-card__health" :class="`goal-card__health--${healthStatus}`">
          {{ healthLabel }}
        </span>
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
          {{ props.goal.target_date ? $t('goal.card.targetDate') + ' ' + formatDate(props.goal.target_date) : $t('goal.card.noDeadline') }}
        </span>
        <NSpace size="small">
          <NButton size="small" quaternary @click="emit('show-plan')">
            {{ $t('goal.card.showPlan') }}
          </NButton>
          <NButton size="small" quaternary @click="emit('edit')">
            {{ $t('goal.card.edit') }}
          </NButton>
          <NPopconfirm @positive-click="emit('delete')">
            <template #trigger>
              <NButton size="small" quaternary type="error">
                {{ $t('goal.card.delete') }}
              </NButton>
            </template>
            {{ $t('goal.card.deleteConfirm') }}
          </NPopconfirm>
        </NSpace>
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

.goal-card__health {
  display: inline-block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.goal-card__health--completed {
  color: var(--color-success);
}

.goal-card__health--on_track {
  color: var(--color-success);
}

.goal-card__health--off_track {
  color: var(--color-warning);
}

.goal-card__health--at_risk {
  color: var(--color-error);
}

.goal-card__health--unknown {
  color: var(--color-text-muted);
}
</style>
