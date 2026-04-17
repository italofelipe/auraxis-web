<script setup lang="ts">
import { provide } from "vue";
import { NSpace, NThing } from "naive-ui";

import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import { getRecommendationLabel } from "~/features/tools/model/installment-vs-cash";

import InstallmentVsCashHero from "./InstallmentVsCashHero.vue";
import InstallmentVsCashBridgeModals from "./InstallmentVsCashBridgeModals.vue";
import {
  INSTALLMENT_VS_CASH_EXPENSE_FORM_KEY,
  INSTALLMENT_VS_CASH_GOAL_FORM_KEY,
} from "./installment-vs-cash-bridge-modals.types";
import { useInstallmentVsCashPage } from "./useInstallmentVsCashPage";

defineOptions({ name: "InstallmentVsCashPage" });

const page = useInstallmentVsCashPage();

provide(INSTALLMENT_VS_CASH_GOAL_FORM_KEY, page.goalForm);
provide(INSTALLMENT_VS_CASH_EXPENSE_FORM_KEY, page.plannedExpenseForm);

/**
 * Adapts ref write-back from v-model on InstallmentVsCashHero.
 *
 * @param value New form state emitted by the hero component.
 */
function updateForm(value: typeof page.form.value): void {
  page.form.value = value;
}
</script>

<template>
  <div class="installment-vs-cash-root">
    <NuxtLayout :name="page.isAuthenticated.value ? 'default' : 'tools-public'">
      <main class="installment-vs-cash-page__content installment-vs-cash-page__content--in-app">
        <InstallmentVsCashHero
          :form="page.form.value"
          :validation-message="page.validationMessage.value"
          :is-loading="page.calculateMutation.isPending.value"
          :is-error="page.calculateMutation.isError.value"
          :t="page.t"
          @update:form="updateForm"
          @submit="page.handleCalculate"
        />

        <section v-if="page.calculation.value" class="installment-vs-cash-page__results">
          <InstallmentVsCashResults :calculation="page.calculation.value" />

          <ToolSaveResult
            intent="goal"
            :label="page.t('pages.installmentVsCash.title')"
            :amount="page.calculation.value.input.cashPrice"
            :description="getRecommendationLabel(page.calculation.value.result.recommendedOption)"
          />

          <UiSurfaceCard>
            <NThing
              :title="page.t('pages.installmentVsCash.results.nextStep')"
              :description="`${getRecommendationLabel(page.calculation.value.result.recommendedOption)}.`"
            />

            <InstallmentVsCashActionBar
              class="installment-vs-cash-page__actions"
              :is-authenticated="page.isAuthenticated.value"
              :has-premium-access="page.hasPremiumAccess.value"
              :is-saving="page.saveMutation.isPending.value"
              :is-bridging="page.isBridging.value"
              :has-saved-simulation="page.savedSimulation.value !== null"
              @save="page.handleSave"
              @goal="page.handleGoalAction"
              @expense="page.handleExpenseAction"
            />
          </UiSurfaceCard>
        </section>

        <section class="installment-vs-cash-page__seo">
          <UiSurfaceCard>
            <NSpace vertical :size="16">
              <NThing
                :title="page.t('pages.installmentVsCash.seoSection.considers')"
                :description="page.t('pages.installmentVsCash.seoSection.considersDesc')"
              />
              <NThing
                :title="page.t('pages.installmentVsCash.seoSection.notReplaces')"
                :description="page.t('pages.installmentVsCash.seoSection.notReplacesDesc')"
              />
              <NThing
                :title="page.t('pages.installmentVsCash.seoSection.howToUse')"
                :description="page.t('pages.installmentVsCash.seoSection.howToUseDesc')"
              />
            </NSpace>
          </UiSurfaceCard>
        </section>
      </main>
      <ToolGuestCta v-if="!page.isAuthenticated.value" />
    </NuxtLayout>

    <InstallmentVsCashBridgeModals
      v-model:show-goal-modal="page.showGoalModal.value"
      v-model:show-expense-modal="page.showExpenseModal.value"
      :fees-enabled="page.form.value.feesEnabled"
      :is-creating-goal="page.createGoalMutation.isPending.value"
      :is-creating-expense="page.createPlannedExpenseMutation.isPending.value"
      :t="page.t"
      @submit-goal="page.submitGoalBridge"
      @submit-expense="page.submitExpenseBridge"
    />
  </div>
</template>

<style scoped>
.installment-vs-cash-root {
  display: contents;
}

.installment-vs-cash-page__content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.installment-vs-cash-page__content--in-app {
  padding: var(--space-4) var(--space-4) var(--space-6);
}

.installment-vs-cash-page__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.installment-vs-cash-page__actions {
  margin-top: var(--space-2);
}

.installment-vs-cash-page__seo {
  padding-bottom: var(--space-4);
}

@media (max-width: 767px) {
  .installment-vs-cash-page__content {
    padding-inline: var(--space-2);
  }
}
</style>
