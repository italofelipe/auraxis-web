<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
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
import {
  calculateCet,
  createDefaultCetFormState,
  validateCetForm,
  type CetFormState,
  type CetResult,
} from "~/features/tools/model/cet";
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
  title: t("cet.seo.title"),
  description: t("cet.seo.description"),
  ogTitle: t("cet.seo.ogTitle"),
  ogDescription: t("cet.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<CetFormState>(createDefaultCetFormState);

const result = ref<CetResult | null>(null);
const savedSimulationId = ref<string | null>(null);

const saveSimulationMutation = useSaveSimulationMutation();

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
  const errors = validateCetForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`cet.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  const calculated = calculateCet(form.value);
  if (!calculated) {
    setValidationError(t("cet.errors.convergenceFailed"));
    return;
  }
  result.value = calculated;
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
      toolId: "cet-calculator",
      ruleVersion: "2026.04",
      metadata: { label: t("cet.simulation.defaultName") },
      inputs: { ...form.value },
      result: {
        cetMonthlyPct: result.value.cetMonthlyPct,
        cetAnnualPct: result.value.cetAnnualPct,
        totalPaid: result.value.totalPaid,
        totalCost: result.value.totalCost,
      },
    });
    savedSimulationId.value = sim.id;
  } catch (err) {
    captureException(err, { context: "cet/save-simulation" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("cet.results.cetMonthly"), value: `${result.value.cetMonthlyPct.toFixed(2)}% a.m.` },
    { label: t("cet.results.nominalMonthly"), value: `${result.value.nominalMonthlyPct.toFixed(2)}% a.m.` },
    { label: t("cet.results.nominalAnnual"), value: `${result.value.nominalAnnualPct.toFixed(2)}% a.a.` },
    { label: t("cet.results.totalPaid"), value: formatBrl(result.value.totalPaid) },
    { label: t("cet.results.totalCost"), value: formatBrl(result.value.totalCost) },
  ];
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value);
</script>

<template>
  <div class="cet-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="cet-page">
      <div class="cet-page__layout">
        <div class="cet-page__form-col">
          <UiPageHeader
            :title="t('cet.hero.title')"
            :subtitle="t('cet.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('cet.form.title')">
                <NFormItem :label="t('cet.form.loanAmount')">
                  <NInputNumber :value="form.loanAmount" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ loanAmount: v })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.nominalMonthlyRate')">
                  <NInputNumber :value="form.nominalMonthlyRatePct" :min="0" :precision="2" style="width: 100%" @update:value="(v) => patch({ nominalMonthlyRatePct: v })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.termMonths')">
                  <NInputNumber :value="form.termMonths" :min="1" :precision="0" style="width: 100%" @update:value="(v) => patch({ termMonths: v })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.tac')">
                  <NInputNumber :value="form.tacAmount" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ tacAmount: v ?? 0 })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.insurance')">
                  <NInputNumber :value="form.insuranceMonthly" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ insuranceMonthly: v ?? 0 })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.appraisal')">
                  <NInputNumber :value="form.appraisalFee" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ appraisalFee: v ?? 0 })" />
                </NFormItem>

                <NFormItem :label="t('cet.form.iofOverride')">
                  <NInputNumber :value="form.iofOverride" :min="0" :precision="2" prefix="R$" :placeholder="t('cet.form.iofAutoPlaceholder')" style="width: 100%" @update:value="(v) => patch({ iofOverride: v })" />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('cet.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('cet.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <div v-if="result" class="cet-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('cet.results.cetAnnual')"
              :value="`${result.cetAnnualPct.toFixed(2)}% a.a.`"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="expense"
              :label="t('cet.hero.title')"
              :amount="result.totalCost"
              :description="t('cet.results.costDescription')"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton v-if="isAuthenticated" :loading="saveSimulationMutation.isPending.value" :disabled="isSaved" block @click="handleSaveSimulation">
                {{ isSaved ? t('cet.actions.saved') : t('cet.actions.save') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing :title="t('cet.results.netReceived')" :description="formatBrl(result.netAmountReceived)" />
            <NThing :title="t('cet.results.iof')" :description="formatBrl(result.iofAmount)" />
            <NThing :title="t('cet.results.monthlyPayment')" :description="formatBrl(result.monthlyPayment)" />
          </UiSurfaceCard>

          <p class="cet-page__disclaimer">{{ t('cet.disclaimer.note') }}</p>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
