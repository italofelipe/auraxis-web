<script setup lang="ts">
import {
  NCard,
  NButton,
  NStatistic,
  NEmpty,
  NRadioGroup,
  NRadioButton,
} from "naive-ui";
import GoalCard from "~/features/goals/components/GoalCard/GoalCard.vue";
import { MOCK_GOALS } from "~/features/goals/mock/goals.mock";
import type { GoalStatus } from "~/features/goals/contracts/goal.dto";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Metas",
  pageSubtitle: "Acompanhe suas metas financeiras",
});

useHead({ title: "Metas | Auraxis" });

type FilterValue = "all" | GoalStatus;

const activeFilter = ref<FilterValue>("all");

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "completed", label: "Concluídas" },
  { value: "paused", label: "Pausadas" },
];

const filteredGoals = computed(() => {
  if (activeFilter.value === "all") {return MOCK_GOALS;}
  return MOCK_GOALS.filter((g) => g.status === activeFilter.value);
});

const totalGoals = computed(() => MOCK_GOALS.length);

const activeGoalsCount = computed(
  () => MOCK_GOALS.filter((g) => g.status === "active").length,
);

const completedGoalsCount = computed(
  () => MOCK_GOALS.filter((g) => g.status === "completed").length,
);
</script>

<template>
  <div class="goals-page">
    <div class="goals-page__header">
      <div class="goals-page__title-block">
        <span class="goals-page__title">Minhas Metas</span>
        <span class="goals-page__subtitle">
          Acompanhe o progresso das suas metas financeiras
        </span>
      </div>
      <NButton type="primary" size="medium">Nova Meta</NButton>
    </div>

    <NCard class="goals-page__summary-card" :bordered="true">
      <div class="goals-page__summary-stats">
        <NStatistic label="Total de metas" :value="String(totalGoals)" />
        <NStatistic label="Em andamento" :value="String(activeGoalsCount)" />
        <NStatistic label="Concluídas" :value="String(completedGoalsCount)" />
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

    <NEmpty
      v-if="filteredGoals.length === 0"
      description="Nenhuma meta encontrada para o filtro selecionado."
      class="goals-page__empty"
    />

    <div v-else class="goals-page__grid">
      <GoalCard
        v-for="goal in filteredGoals"
        :key="goal.id"
        :goal="goal"
      />
    </div>
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

.goals-page__empty {
  padding: var(--space-4) 0;
}

.goals-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

@media (max-width: 640px) {
  .goals-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
