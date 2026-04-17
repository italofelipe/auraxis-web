<script setup lang="ts">
import { computed, ref } from "vue";
import type { EChartsOption } from "echarts";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
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
  PROFILE_OPTIONS,
  calculateReservaEmergencia,
  createDefaultReservaEmergenciaFormState,
  validateReservaEmergenciaForm,
  type ReservaEmergenciaFormState,
  type ReservaEmergenciaResult,
} from "~/features/tools/model/reserva-emergencia";
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
  title: t("reservaEmergencia.seo.title"),
  description: t("reservaEmergencia.seo.description"),
  ogTitle: t("reservaEmergencia.seo.ogTitle"),
  ogDescription: t("reservaEmergencia.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);
const premiumAccessQuery = useEntitlementQuery("advanced_simulations");
const hasPremiumAccess = computed<boolean>(() => premiumAccessQuery.data.value === true);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<ReservaEmergenciaFormState>(createDefaultReservaEmergenciaFormState);

const result = ref<ReservaEmergenciaResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

const profileOptions = computed(() =>
  PROFILE_OPTIONS.map((p) => ({ label: p.label, value: p.value })),
);

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
function handleCalculate(): void {
  const errors = validateReservaEmergenciaForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`reservaEmergencia.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateReservaEmergencia(form.value);
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
  const months = result.value.timeline.map((p) => String(p.month));
  const balanceData = result.value.timeline.map((p) => p.balance);
  return {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: months, name: t("reservaEmergencia.results.chart.xAxis") },
    yAxis: { type: "value", axisLabel: { formatter: (val: number): string => formatBrl(val) } },
    series: [
      { name: t("reservaEmergencia.results.chart.balance"), type: "area", data: balanceData, smooth: true, areaStyle: {} },
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
      name: t("reservaEmergencia.simulation.defaultName"),
      toolSlug: "reserva_emergencia",
      inputs: { ...form.value },
      result: { targetAmount: result.value.targetAmount, monthsToTarget: result.value.monthsToTarget, gap: result.value.gap },
    });
    savedSimulationId.value = sim.id;
    return sim.id;
  } catch (err) {
    captureException(err, { context: "reserva-emergencia/save-simulation" });
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
      name: t("reservaEmergencia.simulation.goalName"),
      target_amount: result.value.targetAmount,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "reserva-emergencia/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("reservaEmergencia.results.profileMonths"), value: `${result.value.profileMonths} meses` },
    { label: t("reservaEmergencia.results.gap"), value: formatBrl(result.value.gap) },
    { label: t("reservaEmergencia.results.monthsToTarget"), value: `${result.value.monthsToTarget} meses` },
  ];
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value);
</script>

<template>
  <div class="reserva-emergencia-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="reserva-emergencia-page">
      <div class="reserva-emergencia-page__layout">
        <div class="reserva-emergencia-page__form-col">
          <UiPageHeader
            :title="t('reservaEmergencia.hero.title')"
            :subtitle="t('reservaEmergencia.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('reservaEmergencia.form.title')">
                <NFormItem :label="t('reservaEmergencia.form.monthlyExpenses')">
                  <NInputNumber :value="form.monthlyExpenses" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ monthlyExpenses: v })" />
                </NFormItem>

                <NFormItem :label="t('reservaEmergencia.form.profile')">
                  <NSelect :value="form.profile" :options="profileOptions" style="width: 100%" @update:value="(v) => patch({ profile: v })" />
                </NFormItem>

                <NFormItem :label="t('reservaEmergencia.form.currentReserve')">
                  <NInputNumber :value="form.currentReserve" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ currentReserve: v ?? 0 })" />
                </NFormItem>

                <NFormItem :label="t('reservaEmergencia.form.monthlyContribution')">
                  <NInputNumber :value="form.monthlyContribution" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ monthlyContribution: v })" />
                </NFormItem>

                <NFormItem :label="t('reservaEmergencia.form.annualReturnPct')">
                  <NInputNumber :value="form.annualReturnPct" :min="0" :precision="2" style="width: 100%" @update:value="(v) => patch({ annualReturnPct: v ?? 12.25 })" />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('reservaEmergencia.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('reservaEmergencia.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <div v-if="result" class="reserva-emergencia-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('reservaEmergencia.results.targetAmount')"
              :value="formatBrl(result.targetAmount)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('reservaEmergencia.hero.title')"
              :amount="result.targetAmount"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton v-if="isAuthenticated" :loading="saveSimulationMutation.isPending.value" :disabled="isSaved" block @click="handleSaveSimulation">
                {{ isSaved ? t('reservaEmergencia.actions.saved') : t('reservaEmergencia.actions.save') }}
              </NButton>
              <NButton v-if="hasPremiumAccess" type="primary" :loading="createGoalMutation.isPending.value" :disabled="goalAdded" block @click="handleAddAsGoal">
                {{ goalAdded ? t('reservaEmergencia.actions.goalAdded') : t('reservaEmergencia.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing v-for="inv in result.investments" :key="inv.name" :title="inv.name" :description="`${inv.monthsToTarget} meses (${inv.annualRatePct}% a.a.)`" />
          </UiSurfaceCard>

          <UiSurfaceCard>
            <UiChart :option="chartOption" height="280px" />
          </UiSurfaceCard>

          <p class="reserva-emergencia-page__disclaimer">{{ t('reservaEmergencia.disclaimer.note') }}</p>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
