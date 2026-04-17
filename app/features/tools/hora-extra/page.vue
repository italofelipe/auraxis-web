<script setup lang="ts">
import { computed, ref } from "vue";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useToolPageContext } from "~/features/tools/composables/use-tool-page-context";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import {
  calculateHoraExtra,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
  type HoraExtraResult,
} from "~/features/tools/model/hora-extra";

import HoraExtraActions from "./HoraExtraActions.vue";
import HoraExtraForm from "./HoraExtraForm.vue";
import HoraExtraResultPanel from "./HoraExtraResult.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

defineOptions({ name: "HoraExtraPage" });

const { t, toast, getErrorMessage, router, isAuthenticated, hasPremiumAccess, formatBrl } =
  useToolPageContext();

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<HoraExtraFormState>(createDefaultHoraExtraFormState);

const result = ref<HoraExtraResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const saveSimulationMutation = useSaveSimulationMutation();

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateHoraExtraForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`horaExtra.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateHoraExtra(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("horaExtra.results.totalOvertimeGross"), value: formatBrl(result.value.totalOvertimeGross) },
    {
      label: t("horaExtra.results.inssOvertimeImpact"),
      value: result.value.inssOvertimeImpact > 0
        ? `\u2212 ${formatBrl(result.value.inssOvertimeImpact)}`
        : formatBrl(0),
    },
    { label: t("horaExtra.results.hourlyRate"), value: formatBrl(result.value.hourlyRate) },
    { label: t("horaExtra.results.totalOvertimeHours"), value: `${result.value.totalOvertimeHours}h` },
  ];
});

/**
 * Persists the current simulation and caches the resulting id.
 */
async function handleSaveSimulation(): Promise<void> {
  if (savedSimulationId.value || !result.value) { return; }
  try {
    const simulation = await saveSimulationMutation.mutateAsync({
      name: t("horaExtra.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "hora_extra",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
  } catch (err) {
    captureException(err, { context: "hora-extra/save-simulation" });
    toast.error(getErrorMessage(err));
  }
}
</script>

<template>
  <div class="hora-extra-root">
    <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
      <div class="hora-extra-page">
        <div class="hora-extra-page__layout">
          <div class="hora-extra-page__form-col">
            <UiPageHeader
              :title="t('horaExtra.hero.title')"
              :subtitle="t('horaExtra.hero.subtitle')"
            />
            <HoraExtraForm
              :form="form"
              :validation-error="validationError"
              :is-dirty="isDirty"
              :t="t"
              @patch="patch"
              @reset="handleReset"
              @submit="handleCalculate"
            />
          </div>

          <div class="hora-extra-page__results-col">
            <UiStickySummaryCard v-if="result">
              <CalculatorResultSummary
                :label="t('horaExtra.results.netOvertimeEstimate')"
                :value="formatBrl(result.netOvertimeEstimate)"
                :metrics="summaryMetrics"
              />
            </UiStickySummaryCard>

            <template v-if="result">
              <UiSurfaceCard>
                <div class="hora-extra-page__breakdown">
                  <HoraExtraResultPanel :result="result" />
                </div>
              </UiSurfaceCard>

              <ToolSaveResult
                intent="receivable"
                :label="t('horaExtra.hero.title')"
                :amount="result.netOvertimeEstimate"
              />

              <HoraExtraActions
                :saved-simulation-id="savedSimulationId"
                :is-saving="saveSimulationMutation.isPending.value"
                :has-premium-access="hasPremiumAccess"
                :t="t"
                @save="handleSaveSimulation"
                @upgrade="router.push('/subscription')"
              />
            </template>
          </div>
        </div>
      </div>
      <ToolGuestCta v-if="!isAuthenticated" />
    </NuxtLayout>
  </div>
</template>

<style scoped>
.hora-extra-root {
  display: contents;
}

.hora-extra-page {
  min-height: 100vh;
  padding: var(--space-6, 24px);
  background: var(--color-bg-base);
}

.hora-extra-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hora-extra-page__layout {
    grid-template-columns: 1fr;
  }
}

.hora-extra-page__form-col,
.hora-extra-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}
</style>
