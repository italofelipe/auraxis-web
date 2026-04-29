<script setup lang="ts">
import { computed, ref } from "vue";
import type { EChartsOption } from "echarts";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NTag,
  NThing,
  useMessage,
} from "naive-ui";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  calculateQuitacaoDividas,
  createDefaultDebtEntry,
  createDefaultQuitacaoDividasFormState,
  validateQuitacaoDividasForm,
  type QuitacaoDividasFormState,
  type QuitacaoDividasResult,
} from "~/features/tools/model/quitacao-dividas";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiChart from "~/components/ui/UiChart.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const toast = useMessage();
const { getErrorMessage } = useApiError();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("quitacaoDividas.seo.title"),
  description: t("quitacaoDividas.seo.description"),
  ogTitle: t("quitacaoDividas.seo.ogTitle"),
  ogDescription: t("quitacaoDividas.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);
const premiumAccessQuery = useEntitlementQuery("advanced_simulations");
const hasPremiumAccess = computed<boolean>(() => premiumAccessQuery.data.value === true);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<QuitacaoDividasFormState>(createDefaultQuitacaoDividasFormState);

const result = ref<QuitacaoDividasResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

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
function addDebt(): void {
  patch({ debts: [...form.value.debts, createDefaultDebtEntry()] });
}

/**
 *
 * @param index
 */
function removeDebt(index: number): void {
  if (form.value.debts.length <= 2) { return; }
  const debts = [...form.value.debts];
  debts.splice(index, 1);
  patch({ debts });
}

/**
 *
 * @param index
 * @param field
 * @param value
 */
function updateDebt(index: number, field: string, value: unknown): void {
  const debts = [...form.value.debts];
  const current = debts[index];
  if (!current) { return; }
  debts[index] = { ...current, [field]: value };
  patch({ debts });
}

/**
 *
 */
function handleCalculate(): void {
  const errors = validateQuitacaoDividasForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`quitacaoDividas.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateQuitacaoDividas(form.value);
}

/**
 *
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalAdded.value = false;
}

const chartOption = computed<EChartsOption>(() => {
  if (!result.value) { return {} as EChartsOption; }
  const months = result.value.snowball.timeline.map((p) => String(p.month));
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["Snowball", "Avalanche"] },
    xAxis: { type: "category", data: months, name: t("quitacaoDividas.results.chart.xAxis") },
    yAxis: { type: "value", axisLabel: { formatter: (val: number): string => formatBrl(val) } },
    series: [
      { name: "Snowball", type: "line", data: result.value.snowball.timeline.map((p) => p.totalBalance), smooth: true },
      { name: "Avalanche", type: "line", data: result.value.avalanche.timeline.map((p) => p.totalBalance), smooth: true },
    ],
  } as unknown as EChartsOption;
});

/**
 * @returns Saved simulation ID or null.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }
  try {
    const sim = await saveSimulationMutation.mutateAsync({
      toolId: "debt-payoff",
      ruleVersion: "2026.04",
      metadata: { label: t("quitacaoDividas.simulation.defaultName") },
      inputs: { ...form.value },
      result: {
        totalDebt: result.value.totalDebt,
        bestStrategy: result.value.bestStrategy,
        interestSaved: result.value.interestSaved,
      },
    });
    savedSimulationId.value = sim.id;
    return sim.id;
  } catch (err) {
    captureException(err, { context: "quitacao-dividas/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 *
 */
async function handleSaveSimulation(): Promise<void> { await ensureSimulationSaved(); }

/**
 *
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }
  await ensureSimulationSaved();
  try {
    await createGoalMutation.mutateAsync({
      name: t("quitacaoDividas.simulation.goalName"),
      target_amount: result.value.totalDebt,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "quitacao-dividas/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("quitacaoDividas.results.snowballMonths"), value: `${result.value.snowball.totalMonths} meses` },
    { label: t("quitacaoDividas.results.avalancheMonths"), value: `${result.value.avalanche.totalMonths} meses` },
    { label: t("quitacaoDividas.results.interestSaved"), value: formatBrl(result.value.interestSaved) },
  ];
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value);
</script>

<template>
  <div class="quitacao-dividas-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="quitacao-dividas-page">
      <div class="quitacao-dividas-page__layout">
        <div class="quitacao-dividas-page__form-col">
          <UiPageHeader
            :title="t('quitacaoDividas.hero.title')"
            :subtitle="t('quitacaoDividas.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('quitacaoDividas.form.title')">
                <div v-for="(debt, i) in form.debts" :key="i" class="quitacao-dividas-page__debt-row">
                  <NFormItem :label="t('quitacaoDividas.form.debtName')">
                    <NInput :value="debt.name" :placeholder="t('quitacaoDividas.form.debtNamePlaceholder')" @update:value="(v) => updateDebt(i, 'name', v)" />
                  </NFormItem>
                  <NFormItem :label="t('quitacaoDividas.form.balance')">
                    <NInputNumber :value="debt.balance" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => updateDebt(i, 'balance', v ?? 0)" />
                  </NFormItem>
                  <NFormItem :label="t('quitacaoDividas.form.monthlyRate')">
                    <NInputNumber :value="debt.monthlyRatePct" :min="0" :precision="2" style="width: 100%" @update:value="(v) => updateDebt(i, 'monthlyRatePct', v ?? 0)" />
                  </NFormItem>
                  <NFormItem :label="t('quitacaoDividas.form.minimumPayment')">
                    <NInputNumber :value="debt.minimumPayment" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => updateDebt(i, 'minimumPayment', v ?? 0)" />
                  </NFormItem>
                  <NButton v-if="form.debts.length > 2" quaternary size="small" @click="removeDebt(i)">
                    {{ t('quitacaoDividas.form.removeDebt') }}
                  </NButton>
                </div>

                <NButton size="small" style="margin-bottom: 16px" @click="addDebt">
                  {{ t('quitacaoDividas.form.addDebt') }}
                </NButton>

                <NFormItem :label="t('quitacaoDividas.form.extraPayment')">
                  <NInputNumber :value="form.extraPayment" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ extraPayment: v ?? 0 })" />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('quitacaoDividas.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('quitacaoDividas.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <div v-if="result" class="quitacao-dividas-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('quitacaoDividas.results.totalDebt')"
              :value="formatBrl(result.totalDebt)"
              :metrics="summaryMetrics"
            />

            <NTag :type="result.bestStrategy === 'avalanche' ? 'success' : 'info'" round>
              {{ t(`quitacaoDividas.results.best.${result.bestStrategy}`) }}
            </NTag>

            <ToolSaveResult
              intent="goal"
              :label="t('quitacaoDividas.hero.title')"
              :amount="result.totalDebt"
              :description="t('quitacaoDividas.results.goalDescription')"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton v-if="isAuthenticated" :loading="saveSimulationMutation.isPending.value" :disabled="isSaved" block @click="handleSaveSimulation">
                {{ isSaved ? t('quitacaoDividas.actions.saved') : t('quitacaoDividas.actions.save') }}
              </NButton>
              <NButton v-if="hasPremiumAccess" type="primary" :loading="createGoalMutation.isPending.value" :disabled="goalAdded" block @click="handleAddAsGoal">
                {{ goalAdded ? t('quitacaoDividas.actions.goalAdded') : t('quitacaoDividas.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing :title="'Snowball'" :description="`${result.snowball.totalMonths} meses — ${formatBrl(result.snowball.totalInterest)} em juros`" />
            <NThing :title="'Avalanche'" :description="`${result.avalanche.totalMonths} meses — ${formatBrl(result.avalanche.totalInterest)} em juros`" />
          </UiSurfaceCard>

          <UiSurfaceCard>
            <UiChart :option="chartOption" height="280px" />
          </UiSurfaceCard>

          <p class="quitacao-dividas-page__disclaimer">{{ t('quitacaoDividas.disclaimer.note') }}</p>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
