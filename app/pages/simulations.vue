<script setup lang="ts">
import {
  NButton,
  NEmpty,
  NRadioGroup,
  NRadioButton,
  NPageHeader,
} from "naive-ui";
import SimulationCard from "~/features/simulations/components/SimulationCard/SimulationCard.vue";
import { MOCK_SIMULATIONS } from "~/features/simulations/mock/simulations.mock";
import type { SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Simulações",
  pageSubtitle: "Simule cenários financeiros",
});

useHead({ title: "Simulações | Auraxis" });

type FilterValue = "all" | SimulationType;

const simulations = ref([...MOCK_SIMULATIONS]);
const activeFilter = ref<FilterValue>("all");

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "installment_vs_cash", label: "Parcelamento × À vista" },
  { value: "goal_projection", label: "Projeção de Meta" },
  { value: "investment_return", label: "Retorno" },
];

const filteredSimulations = computed(() => {
  if (activeFilter.value === "all") {return simulations.value;}
  return simulations.value.filter((s) => s.type === activeFilter.value);
});

/**
 * Removes a simulation from local state by id.
 *
 * @param id - The simulation id to remove.
 */
const onDelete = (id: string): void => {
  simulations.value = simulations.value.filter((s) => s.id !== id);
};
</script>

<template>
  <div class="simulations-page">
    <div class="simulations-page__header">
      <NPageHeader
        title="Simulações"
        subtitle="Projete cenários financeiros e guarde seus resultados"
        class="simulations-page__page-header"
      />
      <NButton type="primary" size="medium">Nova simulação</NButton>
    </div>

    <div class="simulations-page__filter-bar">
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
      v-if="filteredSimulations.length === 0"
      description="Nenhuma simulação encontrada para o filtro selecionado."
      class="simulations-page__empty"
    />

    <div v-else class="simulations-page__grid">
      <SimulationCard
        v-for="sim in filteredSimulations"
        :key="sim.id"
        :simulation="sim"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.simulations-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.simulations-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.simulations-page__page-header {
  flex: 1 1 auto;
}

.simulations-page__filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.simulations-page__empty {
  padding: var(--space-4) 0;
}

.simulations-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-3);
}

@media (max-width: 480px) {
  .simulations-page__grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 481px) and (max-width: 900px) {
  .simulations-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 901px) {
  .simulations-page__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
