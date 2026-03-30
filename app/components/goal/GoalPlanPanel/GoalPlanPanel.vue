<script setup lang="ts">
import { NStatistic, NTag } from "naive-ui";
import { computed, ref, watch } from "vue";
import type { GoalPlanPanelProps } from "./GoalPlanPanel.types";
import { useGoalPlanQuery } from "~/features/goals/queries/use-goal-plan-query";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

const props = defineProps<GoalPlanPanelProps>();

const goalIdRef = ref<string | null>(props.goalId);

watch(
  () => props.goalId,
  (val) => {
    goalIdRef.value = val;
  },
);

const { data: plan, isLoading, isError } = useGoalPlanQuery(goalIdRef);

/**
 * Formats an ISO date string to a localised long date.
 *
 * @param value - ISO date string (YYYY-MM-DD or ISO-8601).
 * @returns Formatted string like "31 de dezembro de 2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const monthsLabel = computed((): string => {
  if (!plan.value) {
    return "—";
  }
  const n = plan.value.months_remaining;
  return n === 1
    ? t("goal.plan.monthsRemaining", { n })
    : t("goal.plan.monthsRemainingPlural", { n });
});

const onTrackType = computed((): "success" | "warning" => {
  return plan.value?.is_on_track ? "success" : "warning";
});

const onTrackLabel = computed((): string => {
  return plan.value?.is_on_track ? t("goal.plan.onTrack") : t("goal.plan.delayed");
});
</script>

<template>
  <UiSurfaceCard v-if="props.goalId !== null" class="goal-plan-panel">
    <div class="goal-plan-panel__header">
      <span class="goal-plan-panel__title">{{ $t('goal.plan.title') }}</span>
      <NTag
        v-if="plan"
        :type="onTrackType"
        size="small"
        :bordered="false"
      >
        {{ onTrackLabel }}
      </NTag>
    </div>

    <UiPageLoader v-if="isLoading" :rows="3" />

    <UiInlineError
      v-else-if="isError"
      :title="$t('goal.plan.loadError')"
      :message="$t('goal.plan.loadErrorMessage')"
    />

    <div v-else-if="plan" class="goal-plan-panel__stats">
      <NStatistic
        :label="$t('goal.plan.monthlyContribution')"
        :value="formatCurrency(plan.required_monthly_contribution)"
      />
      <NStatistic
        :label="$t('goal.plan.deadline')"
        :value="monthsLabel"
      />
      <NStatistic
        :label="$t('goal.plan.projectedCompletion')"
        :value="formatDate(plan.projected_completion_date)"
      />
    </div>
  </UiSurfaceCard>
</template>

<style scoped>
.goal-plan-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.goal-plan-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.goal-plan-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goal-plan-panel__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}
</style>
