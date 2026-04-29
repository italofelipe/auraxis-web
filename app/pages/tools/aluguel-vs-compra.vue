<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NThing,
} from "naive-ui";

import {
  calculateAluguelVsCompra,
  createDefaultAluguelVsCompraFormState,
  validateAluguelVsCompraForm,
  type AluguelVsCompraFormState,
  type AluguelVsCompraResult,
} from "~/features/tools/model/aluguel-vs-compra";
import { useToolPage } from "~/features/tools/composables/use-tool-page";
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

const {
  t,
  isAuthenticated, hasPremiumAccess, formatBrl,
  form, validationError, isDirty, patch, reset, setValidationError,
  result, savedSimulationId, goalAdded,
  saveSimulationMutation, createGoalMutation,
  handleSaveSimulation, handleAddAsGoal,
  isBridging, isSaved,
} = useToolPage<AluguelVsCompraFormState, AluguelVsCompraResult>({
  createDefaultState: createDefaultAluguelVsCompraFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "rent-vs-buy",
    ruleVersion: "2026.04",
    metadata: { label: t("aluguelVsCompra.simulation.defaultName", { year: new Date().getFullYear() }) },
    inputs: { ...form },
    result: {
      finalBuyNetWorth: result.finalBuyNetWorth,
      finalRentNetWorth: result.finalRentNetWorth,
      totalRentCost: result.totalRentCost,
      totalBuyCost: result.totalBuyCost,
      breakEvenYear: result.breakEvenYear,
      buyIsBetter: result.buyIsBetter,
      propertyValueAtEnd: result.propertyValueAtEnd,
    },
  }),
  getGoalPayload: ({ result, t }) => ({
    name: t("aluguelVsCompra.simulation.goalName"),
    target_amount: result.propertyValueAtEnd,
  }),
});

useSeoMeta({
  title: t("aluguelVsCompra.seo.title"),
  description: t("aluguelVsCompra.seo.description"),
  ogTitle: t("aluguelVsCompra.seo.ogTitle"),
  ogDescription: t("aluguelVsCompra.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

// ─── Chart options ────────────────────────────────────────────────────────────

const chartOption = computed<EChartsOption>(() => {
  if (!result.value) { return {} as EChartsOption; }

  const years = result.value.chartData.map((p) => String(p.year));
  const buyData = result.value.chartData.map((p) => p.buyNetWorth);
  const rentData = result.value.chartData.map((p) => p.rentNetWorth);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ seriesName: string; value: number }>): string =>
        params.map((p) => `${p.seriesName}: ${formatBrl(p.value)}`).join("<br/>"),
    },
    legend: {
      data: [
        t("aluguelVsCompra.results.chart.buy"),
        t("aluguelVsCompra.results.chart.rent"),
      ],
    },
    xAxis: {
      type: "category",
      data: years,
      name: t("aluguelVsCompra.results.chart.xAxis"),
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (val: number): string => formatBrl(val),
      },
    },
    series: [
      {
        name: t("aluguelVsCompra.results.chart.buy"),
        type: "line",
        data: buyData,
        smooth: true,
      },
      {
        name: t("aluguelVsCompra.results.chart.rent"),
        type: "line",
        data: rentData,
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
  const errors = validateAluguelVsCompraForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`aluguelVsCompra.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateAluguelVsCompra(form.value);
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
      label: t("aluguelVsCompra.results.finalBuyNetWorth"),
      value: formatBrl(result.value.finalBuyNetWorth),
    },
    {
      label: t("aluguelVsCompra.results.finalRentNetWorth"),
      value: formatBrl(result.value.finalRentNetWorth),
    },
    {
      label: t("aluguelVsCompra.results.totalRentCost"),
      value: formatBrl(result.value.totalRentCost),
    },
    {
      label: t("aluguelVsCompra.results.breakEvenYear"),
      value: result.value.breakEvenYear !== null
        ? t("aluguelVsCompra.results.breakEvenYearValue", { year: result.value.breakEvenYear })
        : t("aluguelVsCompra.results.breakEvenNever"),
    },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="avc-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="avc-page avc-page--authenticated">
      <div class="avc-page__layout">
        <!-- Form column -->
        <div class="avc-page__form-col">
          <UiPageHeader
            :title="t('aluguelVsCompra.hero.title')"
            :subtitle="t('aluguelVsCompra.hero.subtitle')"
          />

          <UiGlassPanel class="avc-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('aluguelVsCompra.form.title')">
                <NFormItem :label="t('aluguelVsCompra.form.propertyValue')">
                  <NInputNumber
                    :value="form.propertyValue"
                    :placeholder="t('aluguelVsCompra.form.propertyValuePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ propertyValue: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.monthlyRent')">
                  <NInputNumber
                    :value="form.monthlyRent"
                    :placeholder="t('aluguelVsCompra.form.monthlyRentPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthlyRent: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.downPaymentAvailable')">
                  <NInputNumber
                    :value="form.downPaymentAvailable"
                    :placeholder="t('aluguelVsCompra.form.downPaymentPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ downPaymentAvailable: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.annualInvestmentReturnPct')">
                  <NInputNumber
                    :value="form.annualInvestmentReturnPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ annualInvestmentReturnPct: v ?? 10 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.annualPropertyValorizationPct')">
                  <NInputNumber
                    :value="form.annualPropertyValorizationPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ annualPropertyValorizationPct: v ?? 5 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.analysisYears')">
                  <NInputNumber
                    :value="form.analysisYears"
                    :min="1"
                    :max="50"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ analysisYears: v ?? 20 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.mortgageAnnualRatePct')">
                  <NInputNumber
                    :value="form.mortgageAnnualRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ mortgageAnnualRatePct: v ?? 12 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aluguelVsCompra.form.monthlyIptuCondominio')">
                  <NInputNumber
                    :value="form.monthlyIptuCondominio"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthlyIptuCondominio: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="avc-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('aluguelVsCompra.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('aluguelVsCompra.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div v-if="result" class="avc-page__results-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('aluguelVsCompra.results.verdict')"
              :value="result.buyIsBetter ? t('aluguelVsCompra.results.buyWins') : t('aluguelVsCompra.results.rentWins')"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('aluguelVsCompra.hero.title')"
              :amount="result.totalBuyCost"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('aluguelVsCompra.actions.saved') : t('aluguelVsCompra.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                type="primary"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('aluguelVsCompra.actions.goalAdded') : t('aluguelVsCompra.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <!-- Evolution chart -->
          <UiSurfaceCard class="avc-page__chart">
            <UiChart :option="chartOption" height="280px" />
          </UiSurfaceCard>

          <!-- Detail rows -->
          <UiSurfaceCard>
            <NThing
              :title="t('aluguelVsCompra.results.propertyValueAtEnd')"
              :description="formatBrl(result.propertyValueAtEnd)"
            />
            <NThing
              :title="t('aluguelVsCompra.results.opportunityCost')"
              :description="formatBrl(result.opportunityCost)"
            />
            <NThing
              :title="t('aluguelVsCompra.results.totalBuyCost')"
              :description="formatBrl(result.totalBuyCost)"
            />
          </UiSurfaceCard>

          <!-- Disclaimer -->
          <UiSurfaceCard>
            <p class="avc-page__disclaimer">{{ t('aluguelVsCompra.disclaimer.note') }}</p>
          </UiSurfaceCard>
        </div>
      </div>
    </div>
        <!-- Guest CTA — shown below result for unauthenticated users -->
        <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>

<style scoped>
/* ── Root & page ─────────────────────────────────────────────────────────────── */
.avc-root {
  display: contents;
}

.avc-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.avc-page--authenticated {
  padding: var(--space-6, 24px);
}

.avc-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .avc-page__layout {
    grid-template-columns: 1fr;
  }
}

.avc-page__form-col,
.avc-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.avc-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.avc-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.avc-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.avc-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.avc-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.avc-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.avc-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.avc-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.avc-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .avc-page__hero {
    grid-template-columns: 1fr;
  }
}

.avc-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.avc-page__results-section {
  margin-top: var(--space-6, 24px);
}

.avc-page__results-main,
.avc-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Verdict banner ──────────────────────────────────────────────────────────── */
.avc-page__verdict--buy {
  border-left: 4px solid var(--color-semantic-positive, #22c55e);
}

.avc-page__verdict--rent {
  border-left: 4px solid var(--color-brand-600, #0284c7);
}

.avc-page__verdict-text {
  font-size: var(--font-size-body-md, 15px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1, 4px) 0;
}

.avc-page__verdict-sub {
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Chart ───────────────────────────────────────────────────────────────────── */
.avc-page__chart {
  min-height: 300px;
}

/* ── Disclaimer ──────────────────────────────────────────────────────────────── */
.avc-page__disclaimer {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}
</style>
