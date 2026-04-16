<script setup lang="ts">
import { provide } from "vue";

import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

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
        <div class="thirteenth-salary-page__layout">
          <div class="thirteenth-salary-page__form-col">
            <UiPageHeader
              :title="page.t('thirteenthSalary.hero.title')"
              :subtitle="page.t('thirteenthSalary.hero.subtitle')"
            />

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
          </div>

          <div class="thirteenth-salary-page__results-col">
            <UiStickySummaryCard v-if="page.result.value">
              <CalculatorResultSummary
                :label="page.t('thirteenthSalary.results.totalNet')"
                :value="page.formatBrl(page.result.value.totalNet)"
                :reason="page.t('thirteenthSalary.results.totalNetNote')"
                :metrics="page.summaryMetrics.value"
              />
            </UiStickySummaryCard>

            <template v-if="page.result.value">
              <UiSurfaceCard>
                <ThirteenthSalaryResultPanel :result="page.result.value" />
              </UiSurfaceCard>

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
          </div>
        </div>
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
  display: flex;
  flex-direction: column;
}

.thirteenth-salary-page__layout {
  display: flex;
  gap: var(--space-4);
  align-items: start;
}

.thirteenth-salary-page--authenticated .thirteenth-salary-page__layout {
  padding: var(--space-4);
}

.thirteenth-salary-page__form-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-col {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .thirteenth-salary-page__layout {
    flex-direction: column;
  }

  .thirteenth-salary-page__results-col {
    width: 100%;
  }
}
</style>
