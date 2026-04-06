<script setup lang="ts">
import {
  NCard,
  NButton,
  NStatistic,
  NRadioGroup,
  NRadioButton,
} from "naive-ui";
import { useGoalsQuery } from "~/features/goals/queries/use-goals-query";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useUpdateGoalMutation } from "~/features/goals/queries/use-update-goal-mutation";
import { useDeleteGoalMutation } from "~/features/goals/queries/use-delete-goal-mutation";
import type { GoalDto, GoalStatus, CreateGoalPayload } from "~/features/goals/contracts/goal.dto";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Metas",
  pageSubtitle: "Acompanhe suas metas financeiras",
});

useHead({ title: "Metas | Auraxis" });

type FilterValue = "all" | GoalStatus;

const { data: goals, isLoading, isError } = useGoalsQuery();
const createMutation = useCreateGoalMutation();
const updateMutation = useUpdateGoalMutation();
const deleteMutation = useDeleteGoalMutation();

const activeFilter = ref<FilterValue>("all");
const showForm = ref<boolean>(false);
const editingGoal = ref<GoalDto | null>(null);
const planGoalId = ref<string | null>(null);

const FILTER_OPTIONS = computed((): Array<{ value: FilterValue; label: string }> => [
  { value: "all", label: t("pages.goals.filters.all") },
  { value: "active", label: t("pages.goals.filters.active") },
  { value: "completed", label: t("pages.goals.filters.completed") },
  { value: "paused", label: t("pages.goals.filters.paused") },
]);

const allGoals = computed(() => goals.value ?? []);

const filteredGoals = computed(() => {
  if (activeFilter.value === "all") {return allGoals.value;}
  return allGoals.value.filter((g) => g.status === activeFilter.value);
});

const totalGoals = computed(() => allGoals.value.length);

const activeGoalsCount = computed(
  () => allGoals.value.filter((g) => g.status === "active").length,
);

const completedGoalsCount = computed(
  () => allGoals.value.filter((g) => g.status === "completed").length,
);

/** Opens the form in create mode. */
const onNewGoal = (): void => {
  editingGoal.value = null;
  showForm.value = true;
};

/**
 * Opens the form in edit mode for the given goal.
 *
 * @param goal - The goal to edit.
 */
const onEditGoal = (goal: GoalDto): void => {
  editingGoal.value = goal;
  showForm.value = true;
};

/**
 * Shows the planning panel for the given goal, toggling off if already shown.
 *
 * @param goal - The goal whose plan panel to toggle.
 */
const onShowPlan = (goal: GoalDto): void => {
  planGoalId.value = planGoalId.value === goal.id ? null : goal.id;
};

/**
 * Handles form submission for both create and edit flows.
 *
 * @param payload - The CreateGoalPayload emitted by GoalForm.
 */
const onCreateOrUpdate = (payload: CreateGoalPayload): void => {
  if (editingGoal.value) {
    updateMutation.mutate(
      { id: editingGoal.value.id, ...payload },
      {
        onSuccess: (): void => {
          showForm.value = false;
          editingGoal.value = null;
        },
      },
    );
  } else {
    createMutation.mutate(payload, {
      onSuccess: (): void => {
        showForm.value = false;
      },
    });
  }
};

/**
 * Deletes a goal by ID after the caller triggers confirmation.
 *
 * @param id - The goal ID to delete.
 */
const onDeleteGoal = (id: string): void => {
  deleteMutation.mutate(id, {
    onSuccess: (): void => {
      if (planGoalId.value === id) {
        planGoalId.value = null;
      }
    },
  });
};
</script>

<template>
  <div class="goals-page">
    <div class="goals-page__header">
      <div class="goals-page__title-block">
        <span class="goals-page__title">{{ $t('pages.goals.title') }}</span>
        <span class="goals-page__subtitle">
          {{ $t('pages.goals.subtitle') }}
        </span>
      </div>
      <NButton type="primary" size="medium" @click="onNewGoal">{{ $t('pages.goals.newGoal') }}</NButton>
    </div>

    <UiInlineError
      v-if="isError"
      :title="$t('pages.goals.loadError')"
      :message="$t('pages.goals.loadErrorMessage')"
    />

    <template v-else>
      <NCard class="goals-page__summary-card" :bordered="true">
        <div class="goals-page__summary-stats">
          <NStatistic :label="$t('pages.goals.totalGoals')" :value="String(totalGoals)" />
          <NStatistic :label="$t('pages.goals.inProgress')" :value="String(activeGoalsCount)" />
          <NStatistic :label="$t('pages.goals.completed')" :value="String(completedGoalsCount)" />
        </div>
      </NCard>

      <div class="goals-page__filter-bar">
        <NRadioGroup v-model:value="activeFilter" size="medium">
          <NRadioButton
            v-for="opt in FILTER_OPTIONS"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          />
        </NRadioGroup>
      </div>

      <UiPageLoader v-if="isLoading" :rows="3" />

      <template v-else>
        <UiEmptyState
          v-if="filteredGoals.length === 0"
          icon="goals"
          :title="activeFilter === 'all' ? $t('pages.goals.emptyAllTitle') : $t('pages.goals.empty')"
          :description="activeFilter === 'all' ? $t('pages.goals.emptyAllDescription') : undefined"
          :action-label="activeFilter === 'all' ? $t('pages.goals.emptyCreate') : undefined"
          @action="onNewGoal"
        />

        <div v-else class="goals-page__grid">
          <GoalCard
            v-for="goal in filteredGoals"
            :key="goal.id"
            :goal="goal"
            @edit="onEditGoal(goal)"
            @show-plan="onShowPlan(goal)"
            @delete="onDeleteGoal(goal.id)"
          />
        </div>
      </template>

      <GoalPlanPanel
        v-if="planGoalId !== null"
        :goal-id="planGoalId"
        class="goals-page__plan-panel"
      />
    </template>

    <GoalForm
      :visible="showForm"
      :goal="editingGoal"
      @update:visible="showForm = $event"
      @submit="onCreateOrUpdate"
    />
  </div>
</template>

<style scoped>
.goals-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.goals-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.goals-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.goals-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.goals-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.goals-page__summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}

.goals-page__filter-bar {
  display: flex;
  align-items: center;
}

.goals-page__empty-state {
  padding: var(--space-4) 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.goals-page__empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.goals-page__empty-cta {
  margin-top: var(--space-1);
}

.goals-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

.goals-page__plan-panel {
  margin-top: var(--space-1);
}

@media (max-width: 640px) {
  .goals-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
