<script setup lang="ts">
import { BarChart3, CheckCircle2, Save, ShieldAlert } from "lucide-vue-next";
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
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import PaywallGate from "~/components/paywall/PaywallGate.vue";
import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";

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

const simulationsAccessQuery = useEntitlementQuery("advanced_simulations");
const hasSimulationsAccess = computed(
  () => simulationsAccessQuery.data.value === true,
);

const { data, isLoading, isError } = useSimulationsQuery({
  enabled: hasSimulationsAccess,
});
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

const introSteps = [
  {
    icon: BarChart3,
    title: "Compare possibilidades",
    description: "Teste parcelas, metas e rendimentos antes de assumir um compromisso.",
  },
  {
    icon: Save,
    title: "Salve cenários úteis",
    description: "Guarde hipóteses importantes para revisar depois com mais contexto.",
  },
  {
    icon: ShieldAlert,
    title: "Use como apoio",
    description: "Os resultados orientam seu planejamento, sem substituir análise financeira profissional.",
  },
] as const;

const allSimulations = computed(() => data.value?.cards ?? []);

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
    <PaywallGate feature="advanced_simulations">
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

      <section class="simulations-page__intro" aria-label="Como funcionam as simulações">
        <div class="simulations-page__intro-copy">
          <span class="simulations-page__intro-kicker">
            <CheckCircle2 :size="16" aria-hidden="true" />
            Planejamento sem alterar seus dados reais
          </span>
          <h2>Simulações transformam perguntas financeiras em cenários salvos</h2>
          <p>
            Compare alternativas antes de se comprometer: parcelar ou pagar à vista, antecipar uma
            meta, projetar rendimentos ou revisar uma decisão importante. Cada simulação fica
            registrada para você voltar depois com mais contexto.
          </p>
        </div>
        <div class="simulations-page__intro-steps">
          <article v-for="item in introSteps" :key="item.title">
            <span aria-hidden="true">
              <component :is="item.icon" :size="18" />
            </span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>
      </section>

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

      <template #locked>
        <section class="simulations-page__paywall-card">
          <NPageHeader
            :title="$t('pages.simulations.title')"
            :subtitle="$t('pages.simulations.subtitle')"
            class="simulations-page__page-header"
          />
          <UiUpgradePrompt
            :feature-name="$t('pages.simulations.title')"
            :description="$t('pages.simulations.subtitle')"
          />
        </section>
      </template>
    </PaywallGate>
  </div>
</template>

<style scoped>
.simulations-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
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

.simulations-page__intro {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(420px, 1.1fr);
  gap: clamp(var(--space-4), 4vw, var(--space-7));
  align-items: stretch;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0%, var(--color-brand-glow-2xs), transparent 34%),
    var(--color-bg-surface);
  padding: clamp(var(--space-4), 3vw, var(--space-6));
  box-shadow: var(--shadow-card);
}

.simulations-page__intro-copy {
  display: grid;
  align-content: center;
  gap: var(--space-2);
}

.simulations-page__intro-kicker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  border-radius: var(--radius-full);
  padding: 6px 10px;
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.simulations-page__intro h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(var(--font-size-xl), 2vw, var(--font-size-2xl));
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

.simulations-page__intro p {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.65;
}

.simulations-page__intro p {
  margin: 0;
  max-width: 720px;
}

.simulations-page__intro-steps {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.simulations-page__intro-steps article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: flex-start;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
}

.simulations-page__intro-steps article > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
}

.simulations-page__intro-steps h3 {
  margin: 0 0 4px;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.simulations-page__intro-steps p {
  max-width: none;
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

.simulations-page__paywall-card {
  display: grid;
  gap: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
}

@media (max-width: 480px) {
  .simulations-page {
    padding: var(--space-3);
  }

  .simulations-page__intro {
    grid-template-columns: 1fr;
  }

  .simulations-page__grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 481px) and (max-width: 900px) {
  .simulations-page__intro {
    grid-template-columns: 1fr;
  }

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
