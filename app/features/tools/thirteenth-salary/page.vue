<script setup lang="ts">
import { provide } from "vue";

import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import LaborCalculatorMarketPulsePage from "~/components/tool/LaborCalculatorMarketPulse/LaborCalculatorMarketPulsePage.vue";

import ThirteenthSalaryResultPanel from "./ThirteenthSalaryResult.vue";
import ThirteenthSalaryForm from "./ThirteenthSalaryForm.vue";
import ThirteenthSalaryActions from "./ThirteenthSalaryActions.vue";
import ThirteenthSalaryBridgeModals from "./ThirteenthSalaryBridgeModals.vue";
import { THIRTEENTH_SALARY_GOAL_FORM_KEY } from "./thirteenth-salary-bridge-modals.types";
import { useThirteenthSalaryPage } from "./useThirteenthSalaryPage";

defineOptions({ name: "ThirteenthSalaryPage" });

const page = useThirteenthSalaryPage();

provide(THIRTEENTH_SALARY_GOAL_FORM_KEY, page.goalForm);

/** Navigates to the subscription page when the user taps the upgrade CTA. */
function handleUpgrade(): void {
  page.router.push("/subscription");
}
</script>

<template>
  <div class="thirteenth-salary-root">
    <NuxtLayout :name="page.isAuthenticated.value ? 'default' : 'tools-public'">
      <div class="thirteenth-salary-page thirteenth-salary-page--authenticated">
        <LaborCalculatorMarketPulsePage
          class="labor-calculator-market-pulse thirteenth-salary-page__market-pulse"
          eyebrow="Calculadora trabalhista"
          :title="page.t('thirteenthSalary.hero.title')"
          :subtitle="page.t('thirteenthSalary.hero.subtitle')"
          context-label="Base legal"
          context-value="13º CLT"
          context-helper="Simula parcelas, descontos e líquido estimado com tabela vigente."
          :has-result="Boolean(page.result.value)"
        >
          <template #form>
            <ThirteenthSalaryForm
              :form="page.form.value"
              :validation-error="page.validationError.value"
              :is-dirty="page.isDirty.value"
              :months-options="page.monthsOptions.value"
              :t="page.t"
              @patch="page.patch"
              @reset="page.handleReset"
              @submit="page.handleCalculate"
            />
          </template>

          <template #results>
            <div v-if="page.result.value" class="thirteenth-salary-page__summary-card">
              <CalculatorResultSummary
                :label="page.t('thirteenthSalary.results.totalNet')"
                :value="page.formatBrl(page.result.value.totalNet)"
                :reason="page.t('thirteenthSalary.results.totalNetNote')"
                :metrics="page.summaryMetrics.value"
              />
            </div>
          </template>

          <template #breakdown>
            <UiSurfaceCard v-if="page.result.value">
              <ThirteenthSalaryResultPanel :result="page.result.value" />
            </UiSurfaceCard>
          </template>

          <template #scenario>
            <p class="thirteenth-salary-page__scenario-note">
              Acompanhe a separação entre primeira parcela, segunda parcela e descontos legais.
            </p>
          </template>

          <template #formula>
            <ul class="thirteenth-salary-page__formula-list">
              <li>Base proporcional: salário bruto dividido por 12 e multiplicado pelos meses trabalhados.</li>
              <li>Primeira parcela: até 50% do bruto proporcional, sem retenções.</li>
              <li>Segunda parcela: aplica INSS e IRRF conforme tabela vigente.</li>
            </ul>
          </template>

          <template #actions>
            <template v-if="page.result.value">
              <ToolSaveResult
                intent="receivable"
                :label="page.t('thirteenthSalary.hero.title')"
                :amount="page.result.value.totalNet"
              />

              <ThirteenthSalaryActions
                :saved-simulation-id="page.savedSimulationId.value"
                :is-saving="page.saveSimulationMutation.isPending.value"
                :is-bridging="page.isBridging.value"
                :has-premium-access="page.hasPremiumAccess.value"
                :t="page.t"
                @save="page.handleSaveSimulation"
                @add-to-goal="page.openGoalModal"
                @add-to-budget="page.openBudgetModal"
                @upgrade="handleUpgrade"
              />
            </template>
          </template>
        </LaborCalculatorMarketPulsePage>
      </div>
      <ToolGuestCta v-if="!page.isAuthenticated.value" />
    </NuxtLayout>

    <ThirteenthSalaryBridgeModals
      v-model:show-goal-modal="page.showGoalModal.value"
      v-model:show-budget-modal="page.showBudgetModal.value"
      :result="page.result.value"
      :is-bridging="page.isBridging.value"
      :is-creating-goal="page.createGoalMutation.isPending.value"
      :is-creating-receivable="page.createReceivableMutation.isPending.value"
      :is-saving-simulation="page.saveSimulationMutation.isPending.value"
      :t="page.t"
      :format-brl="page.formatBrl"
      @create-goal="page.handleCreateGoal"
      @add-to-budget="page.handleAddToBudget"
    />
  </div>
</template>

<style scoped>
.thirteenth-salary-root {
  display: contents;
}

.thirteenth-salary-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.thirteenth-salary-page__summary-card {
  display: contents;
}

.thirteenth-salary-page__scenario-note,
.thirteenth-salary-page__formula-list {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.thirteenth-salary-page__formula-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 18px;
}
</style>
