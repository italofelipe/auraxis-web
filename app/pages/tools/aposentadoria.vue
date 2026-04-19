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
  APOSENTADORIA_TABLE_YEAR,
  calculateAposentadoria,
  createDefaultAposentadoriaFormState,
  validateAposentadoriaForm,
  type AposentadoriaFormState,
  type AposentadoriaResult,
} from "~/features/tools/model/aposentadoria";
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
  t, router,
  isAuthenticated, hasPremiumAccess, formatBrl,
  form, validationError, isDirty, patch, reset, setValidationError,
  result, savedSimulationId, goalAdded,
  saveSimulationMutation, createGoalMutation,
  handleSaveSimulation, handleAddAsGoal,
  isBridging, isSaved,
} = useToolPage<AposentadoriaFormState, AposentadoriaResult>({
  createDefaultState: createDefaultAposentadoriaFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    name: t("aposentadoria.simulation.defaultName", {
      retirementAge: form.retirementAge,
      year: new Date().getFullYear(),
    }),
    toolSlug: "aposentadoria",
    inputs: { ...form },
    result: {
      requiredPatrimony: result.requiredPatrimony,
      requiredMonthlyContribution: result.requiredMonthlyContribution,
      monthsToRetirement: result.monthsToRetirement,
      realReturnPct: result.realReturnPct,
    },
  }),
  getGoalPayload: ({ result, form: rawForm, t }) => {
    const form = rawForm as AposentadoriaFormState;
    return {
      name: t("aposentadoria.simulation.goalName", { retirementAge: form.retirementAge }),
      target_amount: result.requiredPatrimony,
    };
  },
});

useSeoMeta({
  title: t("aposentadoria.seo.title"),
  description: t("aposentadoria.seo.description"),
  ogTitle: t("aposentadoria.seo.ogTitle"),
  ogDescription: t("aposentadoria.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

// ─── Chart ────────────────────────────────────────────────────────────────────

const chartOption = computed<EChartsOption>(() => {
  if (!result.value) { return {} as EChartsOption; }

  const ages = result.value.chartData.map((p) => String(p.age));
  const patrimonyData = result.value.chartData.map((p) => p.patrimony);
  const targetLine = result.value.chartData.map(() => result.value!.requiredPatrimony);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ seriesName: string; value: number }>): string =>
        params.map((p) => `${p.seriesName}: ${formatBrl(p.value)}`).join("<br/>"),
    },
    legend: {
      data: [
        t("aposentadoria.results.chart.patrimony"),
        t("aposentadoria.results.chart.target"),
      ],
    },
    xAxis: {
      type: "category",
      data: ages,
      name: t("aposentadoria.results.chart.xAxis"),
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (val: number): string => formatBrl(val) },
    },
    series: [
      {
        name: t("aposentadoria.results.chart.patrimony"),
        type: "line",
        data: patrimonyData,
        smooth: true,
        areaStyle: { opacity: 0.1 },
      },
      {
        name: t("aposentadoria.results.chart.target"),
        type: "line",
        data: targetLine,
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
  const errors = validateAposentadoriaForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`aposentadoria.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateAposentadoria(form.value);
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
      label: t("aposentadoria.results.monthlyContribution"),
      value: formatBrl(result.value.requiredMonthlyContribution),
    },
    {
      label: t("aposentadoria.results.monthsToRetirement"),
      value: String(result.value.monthsToRetirement),
    },
    {
      label: t("aposentadoria.results.realReturn"),
      value: `${result.value.realReturnPct.toFixed(2)}% a.a.`,
    },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="apos-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="apos-page apos-page--authenticated">
      <div class="apos-page__layout">
        <!-- Form column -->
        <div class="apos-page__form-col">
          <UiPageHeader
            :title="t('aposentadoria.hero.title')"
            :subtitle="t('aposentadoria.hero.subtitle')"
          />

          <UiGlassPanel class="apos-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('aposentadoria.form.title')">
                <NFormItem :label="t('aposentadoria.form.currentAge')">
                  <NInputNumber
                    :value="form.currentAge"
                    :min="18"
                    :max="80"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentAge: v ?? 30 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.retirementAge')">
                  <NInputNumber
                    :value="form.retirementAge"
                    :min="19"
                    :max="100"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ retirementAge: v ?? 65 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.desiredMonthlyIncome')">
                  <NInputNumber
                    :value="form.desiredMonthlyIncome"
                    :placeholder="t('aposentadoria.form.incomePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ desiredMonthlyIncome: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.currentPatrimony')">
                  <NInputNumber
                    :value="form.currentPatrimony"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentPatrimony: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.expectedReturnPct')">
                  <NInputNumber
                    :value="form.expectedReturnPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ expectedReturnPct: v ?? 8 })"
                  />
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.ipcaPct')">
                  <NInputNumber
                    :value="form.ipcaPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ ipcaPct: v ?? 4.5 })"
                  />
                  <p class="apos-page__hint">{{ t('aposentadoria.form.ipcaHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('aposentadoria.form.lifeExpectancy')">
                  <NInputNumber
                    :value="form.lifeExpectancy"
                    :min="50"
                    :max="120"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ lifeExpectancy: v ?? 90 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="apos-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('aposentadoria.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('aposentadoria.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="apos-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('aposentadoria.results.requiredPatrimony')"
              :value="formatBrl(result.requiredPatrimony)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('aposentadoria.hero.title')"
              :amount="result.requiredPatrimony"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('aposentadoria.actions.saved') : t('aposentadoria.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                type="warning"
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('aposentadoria.actions.goalAdded') : t('aposentadoria.actions.addAsGoal') }}
              </NButton>

              <NThing
                v-if="isAuthenticated && !hasPremiumAccess"
                :title="t('aposentadoria.premiumCta.title')"
                :description="t('aposentadoria.premiumCta.description')"
              >
                <template #footer>
                  <NButton size="small" type="warning" @click="router.push('/subscription')">
                    {{ t('aposentadoria.premiumCta.upgrade') }}
                  </NButton>
                </template>
              </NThing>
            </NSpace>
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Sensitivity analysis -->
            <UiSurfaceCard>
              <p class="apos-page__section-title">{{ t('aposentadoria.results.sensitivity') }}</p>
              <div class="apos-page__breakdown">
                <div class="apos-page__breakdown-row">
                  <span>{{ t('aposentadoria.results.baseline') }}</span>
                  <span>{{ formatBrl(result.requiredMonthlyContribution) }}</span>
                </div>
                <div class="apos-page__breakdown-row apos-page__breakdown-row--positive">
                  <span>{{ t('aposentadoria.results.retire5YearsLater') }}</span>
                  <span>{{ formatBrl(result.sensitivityMinus20pct) }}</span>
                </div>
                <div class="apos-page__breakdown-row apos-page__breakdown-row--negative">
                  <span>{{ t('aposentadoria.results.retire5YearsEarlier') }}</span>
                  <span>{{ formatBrl(result.sensitivityPlus20pct) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Chart -->
            <UiSurfaceCard>
              <p class="apos-page__section-title">{{ t('aposentadoria.results.chart.title') }}</p>
              <UiChart :option="chartOption" height="240px" />
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('aposentadoria.disclaimer.note', { year: APOSENTADORIA_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
        <!-- Guest CTA — shown below result for unauthenticated users -->
        <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>

<style scoped>
.apos-root { display: contents; }

.apos-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.apos-page--authenticated { padding: var(--space-6, 24px); }

.apos-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) { .apos-page__layout { grid-template-columns: 1fr; } }

.apos-page__form-col,
.apos-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.apos-page__form-panel { width: 100%; }

.apos-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.apos-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.apos-page__brand { display: flex; align-items: center; gap: var(--space-2, 8px); }

.apos-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary);
}

.apos-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.apos-page__header-actions { display: flex; gap: var(--space-2, 8px); }

.apos-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.apos-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) { .apos-page__hero { grid-template-columns: 1fr; } }

.apos-page__hero-copy { display: flex; flex-direction: column; gap: var(--space-3, 12px); }

.apos-page__results-section { margin-top: var(--space-6, 24px); }

.apos-page__results-main,
.apos-page__results-aside { display: flex; flex-direction: column; gap: var(--space-4, 16px); }

.apos-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.apos-page__hint {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

.apos-page__breakdown { display: flex; flex-direction: column; gap: var(--space-2, 8px); }

.apos-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}

.apos-page__breakdown-row--positive { color: var(--color-semantic-positive, #22c55e); }
.apos-page__breakdown-row--negative { color: var(--color-semantic-negative, #ef4444); }
</style>
