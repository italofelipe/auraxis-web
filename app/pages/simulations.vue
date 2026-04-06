<script setup lang="ts">
import {
  NButton,
  NDropdown,
  NRadioGroup,
  NRadioButton,
  NPageHeader,
  type DropdownOption,
} from "naive-ui";
import { useSimulationsQuery } from "~/features/simulations/queries/use-simulations-query";
import { useDeleteSimulationMutation } from "~/features/simulations/queries/use-delete-simulation-mutation";
import type { SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

const { t } = useI18n();

definePageMeta({
  layout: "default",
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Simulações",
  pageSubtitle: "Simule cenários financeiros",
});

useHead({ title: "Simulações | Auraxis" });

type FilterValue = "all" | SimulationType;

/** Maps each simulation type to its corresponding tool page route. */
const SIMULATION_TYPE_ROUTES: Record<SimulationType, string> = {
  installment_vs_cash: "/tools/installment-vs-cash",
  goal_projection: "/tools/aposentadoria",
  investment_return: "/tools/juros-compostos",
};

const { data: simulations, isLoading, isError } = useSimulationsQuery();
const deleteMutation = useDeleteSimulationMutation();

const activeFilter = ref<FilterValue>("all");

const FILTER_OPTIONS = computed((): Array<{ value: FilterValue; label: string }> => [
  { value: "all", label: t("pages.simulations.filters.all") },
  { value: "installment_vs_cash", label: t("pages.simulations.filters.installmentVsCash") },
  { value: "goal_projection", label: t("pages.simulations.filters.goalProjection") },
  { value: "investment_return", label: t("pages.simulations.filters.investmentReturn") },
]);

/** Dropdown options for selecting the simulation type when creating a new simulation. */
const NEW_SIMULATION_OPTIONS = computed((): DropdownOption[] => [
  { key: "installment_vs_cash", label: t("pages.simulations.typeSelect.installmentVsCash") },
  { key: "goal_projection", label: t("pages.simulations.typeSelect.goalProjection") },
  { key: "investment_return", label: t("pages.simulations.typeSelect.investmentReturn") },
]);

const allSimulations = computed(() => simulations.value ?? []);

const filteredSimulations = computed(() => {
  if (activeFilter.value === "all") {return allSimulations.value;}
  return allSimulations.value.filter((s) => s.type === activeFilter.value);
});

/**
 * Navigates to the tool page corresponding to the selected simulation type.
 *
 * @param key - The simulation type key selected from the dropdown.
 */
const onNewSimulation = (key: string): void => {
  const route = SIMULATION_TYPE_ROUTES[key as SimulationType];
  if (route) {
    void navigateTo(route);
  }
};

/**
 * Deletes a simulation by id via the API.
 *
 * @param id - The simulation id to remove.
 */
const onDelete = (id: string): void => {
  deleteMutation.mutate(id);
};
</script>

<template>
  <div class="simulations-page">
    <div class="simulations-page__header">
      <NPageHeader
        :title="$t('pages.simulations.title')"
        :subtitle="$t('pages.simulations.subtitle')"
        class="simulations-page__page-header"
      />
      <NDropdown
        :options="NEW_SIMULATION_OPTIONS"
        trigger="click"
        @select="onNewSimulation"
      >
        <NButton type="primary" size="medium">
          {{ $t('pages.simulations.newSimulation') }}
        </NButton>
      </NDropdown>
    </div>

    <UiInlineError
      v-if="isError"
      :title="$t('pages.simulations.loadError')"
      :message="$t('pages.simulations.loadErrorMessage')"
    />

    <template v-else>
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

      <UiPageLoader v-if="isLoading" :rows="3" />

      <template v-else>
        <UiEmptyState
          v-if="filteredSimulations.length === 0"
          icon="analytics"
          :title="activeFilter === 'all' ? $t('pages.simulations.emptyAllTitle') : $t('pages.simulations.empty')"
          :description="activeFilter === 'all' ? $t('pages.simulations.emptyAllDescription') : undefined"
        />

        <div v-else class="simulations-page__grid">
          <SimulationCard
            v-for="sim in filteredSimulations"
            :key="sim.id"
            :simulation="sim"
            @delete="onDelete"
          />
        </div>
      </template>
    </template>
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

.simulations-page__empty-state {
  padding: var(--space-4) 0;
  text-align: center;
}

.simulations-page__empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
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
