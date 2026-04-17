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
  JUROS_COMPOSTOS_PERIOD_UNITS,
  calculateJurosCompostos,
  createDefaultJurosCompostosFormState,
  validateJurosCompostosForm,
  type JurosCompostosFormState,
  type JurosCompostosResult,
} from "~/features/tools/model/juros-compostos";
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
  title: t("jurosCompostos.seo.title"),
  description: t("jurosCompostos.seo.description"),
  ogTitle: t("jurosCompostos.seo.ogTitle"),
  ogDescription: t("jurosCompostos.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

// ─── Session & access ─────────────────────────────────────────────────────────

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const premiumAccessQuery = useEntitlementQuery("advanced_simulations");

/**
 * True when the authenticated user holds a premium subscription.
 */
const hasPremiumAccess = computed<boolean>(
  () => premiumAccessQuery.data.value === true,
);

// ─── Calculator form state ────────────────────────────────────────────────────

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<JurosCompostosFormState>(createDefaultJurosCompostosFormState);

const result = ref<JurosCompostosResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

// ─── Select options ───────────────────────────────────────────────────────────

const periodUnitOptions = computed(() =>
  JUROS_COMPOSTOS_PERIOD_UNITS.map((unit) => ({
    label: t(`jurosCompostos.form.period${unit === "months" ? "Months" : "Years"}`),
    value: unit,
  })),
);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a numeric value as Brazilian Real currency string.
 *
 * @param value Number to format.
 * @returns Formatted BRL string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

// ─── Chart options ────────────────────────────────────────────────────────────

const chartOption = computed<EChartsOption>(() => {
  if (!result.value) { return {} as EChartsOption; }

  const months = result.value.chartData.map((p) => String(p.month));
  const nominalData = result.value.chartData.map((p) => p.nominalAmount);
  const contributedData = result.value.chartData.map((p) => p.contributed);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ seriesName: string; value: number }>): string =>
        params.map((p) => `${p.seriesName}: ${formatBrl(p.value)}`).join("<br/>"),
    },
    legend: {
      data: [
        t("jurosCompostos.results.chart.nominal"),
        t("jurosCompostos.results.chart.contributed"),
      ],
    },
    xAxis: {
      type: "category",
      data: months,
      name: t("jurosCompostos.results.chart.xAxis"),
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (val: number): string => formatBrl(val),
      },
    },
    series: [
      {
        name: t("jurosCompostos.results.chart.nominal"),
        type: "line",
        data: nominalData,
        smooth: true,
      },
      {
        name: t("jurosCompostos.results.chart.contributed"),
        type: "line",
        data: contributedData,
        smooth: true,
        lineStyle: { type: "dashed" },
      },
    ],
  } as unknown as EChartsOption;
});

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateJurosCompostosForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`jurosCompostos.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateJurosCompostos(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalAdded.value = false;
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("jurosCompostos.results.finalAmountReal"),
      value: formatBrl(result.value.finalAmountReal),
    },
    {
      label: t("jurosCompostos.results.totalContributed"),
      value: formatBrl(result.value.totalContributed),
    },
    {
      label: t("jurosCompostos.results.totalInterest"),
      value: formatBrl(result.value.totalInterest),
    },
    {
      label: t("jurosCompostos.results.realRate"),
      value: `${result.value.realRatePct.toFixed(2)}% a.a.`,
    },
  ];
});

// ─── Save simulation ──────────────────────────────────────────────────────────

/**
 * Saves the current simulation and returns its id.
 *
 * @returns Simulation id or null on failure.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }

  try {
    const simulation = await saveSimulationMutation.mutateAsync({
      name: t("jurosCompostos.simulation.defaultName", {
        period: form.value.period,
        unit: form.value.periodUnit,
      }),
      toolSlug: "juros_compostos",
      inputs: { ...form.value },
      result: {
        finalAmountNominal: result.value.finalAmountNominal,
        finalAmountReal: result.value.finalAmountReal,
        totalContributed: result.value.totalContributed,
        totalInterest: result.value.totalInterest,
        realRatePct: result.value.realRatePct,
      },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "juros-compostos/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 * Handles the Save Simulation button click.
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}

// ─── Goal bridge (premium) ────────────────────────────────────────────────────

/**
 * Saves the simulation then creates a goal from the final nominal amount.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }

  await ensureSimulationSaved();

  try {
    await createGoalMutation.mutateAsync({
      name: t("jurosCompostos.simulation.goalName", {
        period: form.value.period,
        unit: form.value.periodUnit,
      }),
      target_amount: result.value.finalAmountNominal,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "juros-compostos/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

// ─── Derived action states ────────────────────────────────────────────────────

const isBridging = computed(
  () =>
    saveSimulationMutation.isPending.value ||
    createGoalMutation.isPending.value,
);

const isSaved = computed(() => savedSimulationId.value !== null);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="juros-compostos-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="juros-compostos-page juros-compostos-page--authenticated">
      <div class="juros-compostos-page__layout">
        <!-- Form column -->
        <div class="juros-compostos-page__form-col">
          <UiPageHeader
            :title="t('jurosCompostos.hero.title')"
            :subtitle="t('jurosCompostos.hero.subtitle')"
          />

          <UiGlassPanel class="juros-compostos-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('jurosCompostos.form.title')">
                <NFormItem :label="t('jurosCompostos.form.initialCapital')">
                  <NInputNumber
                    :value="form.initialCapital"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ initialCapital: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('jurosCompostos.form.monthlyContribution')">
                  <NInputNumber
                    :value="form.monthlyContribution"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthlyContribution: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('jurosCompostos.form.nominalRatePct')">
                  <NInputNumber
                    :value="form.nominalRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ nominalRatePct: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('jurosCompostos.form.period')">
                  <NInputNumber
                    :value="form.period"
                    :min="1"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ period: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('jurosCompostos.form.periodUnit')">
                  <NSelect
                    :value="form.periodUnit"
                    :options="periodUnitOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ periodUnit: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('jurosCompostos.form.inflationPct')">
                  <NInputNumber
                    :value="form.inflationPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ inflationPct: v ?? 4.5 })"
                  />
                  <p class="juros-compostos-page__hint">
                    {{ t('jurosCompostos.form.inflationHint') }}
                  </p>
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('jurosCompostos.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('jurosCompostos.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Result column -->
        <div v-if="result" class="juros-compostos-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('jurosCompostos.results.finalAmountNominal')"
              :value="formatBrl(result.finalAmountNominal)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('jurosCompostos.hero.title')"
              :amount="result.finalAmountNominal"
            />

            <NSpace vertical style="margin-top: 16px">
              <!-- Free: save simulation -->
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('jurosCompostos.actions.saved') : t('jurosCompostos.actions.save') }}
              </NButton>

              <!-- Premium: add as goal -->
              <NButton
                v-if="hasPremiumAccess"
                type="primary"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('jurosCompostos.actions.goalAdded') : t('jurosCompostos.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <!-- Detail rows -->
          <UiSurfaceCard class="juros-compostos-page__detail">
            <NThing
              :title="t('jurosCompostos.results.totalContributed')"
              :description="formatBrl(result.totalContributed)"
            />
            <NThing
              :title="t('jurosCompostos.results.totalInterest')"
              :description="formatBrl(result.totalInterest)"
            />
            <NThing
              :title="t('jurosCompostos.results.realRate')"
              :description="`${result.realRatePct.toFixed(2)}% a.a.`"
            />
          </UiSurfaceCard>

          <!-- Evolution chart -->
          <UiSurfaceCard class="juros-compostos-page__chart">
            <UiChart :option="chartOption" height="280px" />
          </UiSurfaceCard>

          <p class="juros-compostos-page__disclaimer">
            {{ t('jurosCompostos.disclaimer.note') }}
          </p>
        </div>
      </div>
    </div>
        <!-- Guest CTA — shown below result for unauthenticated users -->
        <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
