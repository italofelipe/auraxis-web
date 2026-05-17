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
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import LaborCalculatorMarketPulsePage from "~/components/tool/LaborCalculatorMarketPulse/LaborCalculatorMarketPulsePage.vue";

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
      toolId: "overtime",
      ruleVersion: "2026.04",
      inputs: { ...form.value },
      result: { ...result.value },
      metadata: {
        label: t("horaExtra.simulation.defaultName", {
          year: new Date().getFullYear(),
        }),
      },
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
        <LaborCalculatorMarketPulsePage
          class="labor-calculator-market-pulse hora-extra-page__market-pulse"
          eyebrow="Calculadora trabalhista"
          :title="t('horaExtra.hero.title')"
          :subtitle="t('horaExtra.hero.subtitle')"
          context-label="Regra CLT"
          context-value="50% a 100%"
          context-helper="Consolida horas extras, impacto de INSS e estimativa líquida."
          :has-result="Boolean(result)"
        >
          <template #form>
            <HoraExtraForm
              :form="form"
              :validation-error="validationError"
              :is-dirty="isDirty"
              :t="t"
              @patch="patch"
              @reset="handleReset"
              @submit="handleCalculate"
            />
          </template>

          <template #results>
            <div v-if="result" class="hora-extra-page__summary-card">
              <CalculatorResultSummary
                :label="t('horaExtra.results.netOvertimeEstimate')"
                :value="formatBrl(result.netOvertimeEstimate)"
                :metrics="summaryMetrics"
              />
            </div>
          </template>

          <template #breakdown>
            <UiSurfaceCard v-if="result">
              <div class="hora-extra-page__breakdown">
                <HoraExtraResultPanel :result="result" />
              </div>
            </UiSurfaceCard>
          </template>

          <template #scenario>
            <div class="hora-extra-page__scenario-grid">
              <span>Horas 50%: {{ result?.overtime50.hours ?? 0 }}h</span>
              <span>Horas 75%: {{ result?.overtime75.hours ?? 0 }}h</span>
              <span>Horas 100%: {{ result?.overtime100.hours ?? 0 }}h</span>
            </div>
          </template>

          <template #formula>
            <ul class="hora-extra-page__formula-list">
              <li>Valor da hora: salário bruto dividido pela jornada mensal informada.</li>
              <li>Hora extra: valor da hora multiplicado por 1,5, 1,75 ou 2,0.</li>
              <li>Líquido estimado: total bruto das horas extras menos impacto adicional de INSS.</li>
            </ul>
          </template>

          <template #actions>
            <template v-if="result">
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
          </template>
        </LaborCalculatorMarketPulsePage>
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
  background: var(--color-bg-base);
}

.hora-extra-page__summary-card {
  display: contents;
}

.hora-extra-page__scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.hora-extra-page__formula-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--color-text-muted);
  line-height: 1.55;
}

@media (max-width: 640px) {
  .hora-extra-page__scenario-grid {
    grid-template-columns: 1fr;
  }
}
</style>
