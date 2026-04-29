<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NThing,
  useMessage,
} from "naive-ui";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateReceivableMutation } from "~/features/receivables/queries/use-create-receivable-mutation";
import {
  BR_TAX_TABLE_YEAR,
  calculateSalarioLiquido,
  createDefaultSalarioLiquidoFormState,
  validateSalarioLiquidoForm,
  type SalarioLiquidoFormState,
  type SalarioLiquidoResult,
} from "~/features/tools/model/salario-liquido";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const toast = useMessage();
const { getErrorMessage } = useApiError();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("salarioLiquido.seo.title"),
  description: t("salarioLiquido.seo.description"),
  ogTitle: t("salarioLiquido.seo.ogTitle"),
  ogDescription: t("salarioLiquido.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<SalarioLiquidoFormState>(createDefaultSalarioLiquidoFormState);

const result = ref<SalarioLiquidoResult | null>(null);
const savedSimulationId = ref<string | null>(null);

const saveSimulationMutation = useSaveSimulationMutation();
const createReceivableMutation = useCreateReceivableMutation();

/**
 * @param value
 * @returns BRL-formatted string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

/**
 * @returns void
 */
function handleCalculate(): void {
  const errors = validateSalarioLiquidoForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`salarioLiquido.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateSalarioLiquido(form.value);
}

/**
 *
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

/**
 *
 */
async function handleSaveSimulation(): Promise<void> {
  if (savedSimulationId.value || !result.value) { return; }
  try {
    const sim = await saveSimulationMutation.mutateAsync({
      toolId: "salary-net-clt",
      ruleVersion: "2026.04",
      metadata: { label: t("salarioLiquido.simulation.defaultName") },
      inputs: { ...form.value },
      result: {
        netSalary: result.value.netSalary,
        totalDeductions: result.value.totalDeductions,
        employerTotal: result.value.employerTotal,
      },
    });
    savedSimulationId.value = sim.id;
  } catch (err) {
    captureException(err, { context: "salario-liquido/save-simulation" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("salarioLiquido.results.totalDeductions"), value: formatBrl(result.value.totalDeductions) },
    { label: t("salarioLiquido.results.inss"), value: formatBrl(result.value.inss) },
    { label: t("salarioLiquido.results.irrf"), value: formatBrl(result.value.irrf) },
    { label: t("salarioLiquido.results.employerTotal"), value: formatBrl(result.value.employerTotal) },
  ];
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value || createReceivableMutation.isPending.value);
</script>

<template>
  <div class="salario-liquido-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="salario-liquido-page">
      <div class="salario-liquido-page__layout">
        <div class="salario-liquido-page__form-col">
          <UiPageHeader
            :title="t('salarioLiquido.hero.title')"
            :subtitle="t('salarioLiquido.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('salarioLiquido.form.title')">
                <NFormItem :label="t('salarioLiquido.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('salarioLiquido.form.dependents')">
                  <NInputNumber
                    :value="form.dependents"
                    :min="0"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ dependents: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('salarioLiquido.form.healthPlan')">
                  <NInputNumber
                    :value="form.healthPlanDiscount"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ healthPlanDiscount: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('salarioLiquido.form.vaVr')">
                  <NInputNumber
                    :value="form.vaVrDiscount"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ vaVrDiscount: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('salarioLiquido.form.alimonyPct')">
                  <NInputNumber
                    :value="form.alimonyPct"
                    :min="0"
                    :max="100"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ alimonyPct: v ?? 0 })"
                  />
                </NFormItem>

                <NCheckbox
                  :checked="form.vtOptOut"
                  @update:checked="(v) => patch({ vtOptOut: v })"
                >
                  {{ t('salarioLiquido.form.vtOptOut') }}
                </NCheckbox>

                <NCheckbox
                  :checked="form.unionContribution"
                  @update:checked="(v) => patch({ unionContribution: v })"
                >
                  {{ t('salarioLiquido.form.unionContribution') }}
                </NCheckbox>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('salarioLiquido.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('salarioLiquido.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
          <p class="salario-liquido-page__disclaimer">
            {{ t('salarioLiquido.disclaimer.note', { year: BR_TAX_TABLE_YEAR }) }}
          </p>
        </div>

        <div v-if="result" class="salario-liquido-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('salarioLiquido.results.netSalary')"
              :value="formatBrl(result.netSalary)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="receivable"
              :label="t('salarioLiquido.hero.title')"
              :amount="result.netSalary"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('salarioLiquido.actions.saved') : t('salarioLiquido.actions.save') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing
              v-for="d in result.deductions"
              :key="d.label"
              :title="d.label"
              :description="formatBrl(d.amount)"
            />
          </UiSurfaceCard>

          <UiSurfaceCard>
            <NThing :title="t('salarioLiquido.results.employerFgts')" :description="formatBrl(result.employerFgts)" />
            <NThing :title="t('salarioLiquido.results.employerInss')" :description="formatBrl(result.employerInss)" />
            <NThing :title="t('salarioLiquido.results.employerTotal')" :description="formatBrl(result.employerTotal)" />
          </UiSurfaceCard>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
