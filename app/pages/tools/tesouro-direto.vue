<script setup lang="ts">
import { computed } from "vue";
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
} from "naive-ui";

import {
  TESOURO_TABLE_YEAR,
  TESOURO_TYPES,
  calculateTesouroDireto,
  createDefaultTesouroDiretoFormState,
  validateTesouroDiretoForm,
  type TesouroDiretoFormState,
  type TesouroDiretoResult,
} from "~/features/tools/model/tesouro-direto";
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

const { t } = useI18n();

useSeoMeta({
  title: t("tesouroDireto.seo.title"),
  description: t("tesouroDireto.seo.description"),
  ogTitle: t("tesouroDireto.seo.ogTitle"),
  ogDescription: t("tesouroDireto.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const {
  router,
  isAuthenticated,
  hasPremiumAccess,
  formatBrl,
  form,
  validationError,
  isDirty,
  patch,
  reset,
  setValidationError,
  result,
  savedSimulationId,
  goalAdded,
  saveSimulationMutation,
  createGoalMutation,
  handleSaveSimulation,
  handleAddAsGoal,
  isBridging,
  isSaved,
} = useToolPage<TesouroDiretoFormState, TesouroDiretoResult>({
  createDefaultState: createDefaultTesouroDiretoFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "treasury",
    ruleVersion: "2026.04",
    metadata: {
      label: t("tesouroDireto.simulation.defaultName", {
        type: form.type,
        year: new Date().getFullYear(),
      }),
    },
    inputs: { ...form },
    result: {
      netAmount: result.netAmount,
      netReturn: result.netReturn,
      annualizedNetReturn: result.annualizedNetReturn,
      realReturn: result.realReturn,
    },
  }),
  getGoalPayload: ({ result, form: rawForm, t }) => {
    const form = rawForm as TesouroDiretoFormState;
    return {
      name: t("tesouroDireto.simulation.goalName", { type: form.type }),
      target_amount: result.netAmount,
    };
  },
});

// ─── Bond type select ─────────────────────────────────────────────────────────

const bondTypeOptions = computed(() =>
  TESOURO_TYPES.map((type) => ({
    label: t(`tesouroDireto.form.types.${type}`),
    value: type,
  })),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a decimal as a percentage with 2 decimal places.
 *
 * @param value Decimal rate.
 * @returns Formatted string.
 */
function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// ─── Chart options ────────────────────────────────────────────────────────────

const chartOption = computed<EChartsOption>(() => {
  if (!result.value || !form.value.amount) { return {} as EChartsOption; }

  const amount = form.value.amount;
  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ seriesName: string; value: number }>): string =>
        params.map((p) => `${p.seriesName}: ${formatBrl(p.value)}`).join("<br/>"),
    },
    xAxis: {
      type: "category",
      data: [
        t("tesouroDireto.results.chart.principal"),
        t("tesouroDireto.results.chart.grossReturn"),
        t("tesouroDireto.results.chart.custodyFee"),
        t("tesouroDireto.results.chart.irAmount"),
        t("tesouroDireto.results.chart.netReturn"),
      ],
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (val: number): string => formatBrl(val) },
    },
    series: [
      {
        name: t("tesouroDireto.results.chart.value"),
        type: "bar",
        data: [
          amount,
          result.value.grossReturn,
          result.value.custodyFee,
          result.value.irAmount,
          result.value.netReturn,
        ],
      },
    ],
  } as unknown as EChartsOption;
});

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateTesouroDiretoForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`tesouroDireto.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateTesouroDireto(form.value);
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
    { label: t("tesouroDireto.results.grossReturn"), value: formatBrl(result.value.grossReturn) },
    { label: t("tesouroDireto.results.custodyFee"), value: `− ${formatBrl(result.value.custodyFee)}` },
    { label: t("tesouroDireto.results.irAmount"), value: `− ${formatBrl(result.value.irAmount)}` },
    { label: t("tesouroDireto.results.annualizedReturn"), value: formatPct(result.value.annualizedNetReturn) },
    { label: t("tesouroDireto.results.realReturn"), value: formatPct(result.value.realReturn) },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="tesouro-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="tesouro-page tesouro-page--authenticated">
      <div class="tesouro-page__layout">
        <!-- Form column -->
        <div class="tesouro-page__form-col">
          <UiPageHeader
            :title="t('tesouroDireto.hero.title')"
            :subtitle="t('tesouroDireto.hero.subtitle')"
          />

          <UiGlassPanel class="tesouro-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('tesouroDireto.form.title')">
                <NFormItem :label="t('tesouroDireto.form.type')">
                  <NSelect
                    :value="form.type"
                    :options="bondTypeOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ type: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('tesouroDireto.form.amount')">
                  <NInputNumber
                    :value="form.amount"
                    :placeholder="t('tesouroDireto.form.amountPlaceholder')"
                    :min="30"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ amount: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('tesouroDireto.form.termDays')">
                  <NInputNumber
                    :value="form.termDays"
                    :min="1"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ termDays: v ?? 365 })"
                  />
                </NFormItem>

                <NFormItem :label="t('tesouroDireto.form.taxaIndicativaPct')">
                  <NInputNumber
                    :value="form.taxaIndicativaPct"
                    :min="0"
                    :precision="4"
                    style="width: 100%"
                    @update:value="(v) => patch({ taxaIndicativaPct: v })"
                  />
                  <p class="tesouro-page__hint">{{ t('tesouroDireto.form.taxaHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('tesouroDireto.form.selicPct')">
                  <NInputNumber
                    :value="form.selicPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ selicPct: v ?? 10.75 })"
                  />
                  <p class="tesouro-page__hint">{{ t('tesouroDireto.form.selicHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('tesouroDireto.form.ipcaPct')">
                  <NInputNumber
                    :value="form.ipcaPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ ipcaPct: v ?? 4.5 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="tesouro-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('tesouroDireto.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('tesouroDireto.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="tesouro-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('tesouroDireto.results.netAmount')"
              :value="formatBrl(result.netAmount)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('tesouroDireto.hero.title')"
              :amount="result.netReturn"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('tesouroDireto.actions.saved') : t('tesouroDireto.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                type="warning"
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('tesouroDireto.actions.goalAdded') : t('tesouroDireto.actions.addAsGoal') }}
              </NButton>

              <NThing
                v-if="isAuthenticated && !hasPremiumAccess"
                :title="t('tesouroDireto.premiumCta.title')"
                :description="t('tesouroDireto.premiumCta.description')"
              >
                <template #footer>
                  <NButton size="small" type="warning" @click="router.push('/subscription')">
                    {{ t('tesouroDireto.premiumCta.upgrade') }}
                  </NButton>
                </template>
              </NThing>
            </NSpace>
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Breakdown -->
            <UiSurfaceCard>
              <p class="tesouro-page__section-title">{{ t('tesouroDireto.results.breakdown') }}</p>
              <div class="tesouro-page__breakdown">
                <div class="tesouro-page__breakdown-row">
                  <span>{{ t('tesouroDireto.results.grossReturn') }}</span>
                  <span>{{ formatBrl(result.grossReturn) }}</span>
                </div>
                <div class="tesouro-page__breakdown-row tesouro-page__breakdown-row--deduction">
                  <span>{{ t('tesouroDireto.results.custodyFee') }}</span>
                  <span>− {{ formatBrl(result.custodyFee) }}</span>
                </div>
                <div class="tesouro-page__breakdown-row tesouro-page__breakdown-row--deduction">
                  <span>{{ t('tesouroDireto.results.irAmountWithRate', { rate: formatPct(result.irRate) }) }}</span>
                  <span>− {{ formatBrl(result.irAmount) }}</span>
                </div>
                <div class="tesouro-page__breakdown-row tesouro-page__breakdown-row--net">
                  <span>{{ t('tesouroDireto.results.netReturn') }}</span>
                  <span class="tesouro-page__value--positive">{{ formatBrl(result.netReturn) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Chart -->
            <UiSurfaceCard>
              <p class="tesouro-page__section-title">{{ t('tesouroDireto.results.chart.title') }}</p>
              <UiChart :option="chartOption" height="220px" />
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('tesouroDireto.disclaimer.note', { year: TESOURO_TABLE_YEAR }) }}
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
.tesouro-root { display: contents; }

.tesouro-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.tesouro-page--authenticated {
  padding: var(--space-6, 24px);
}

.tesouro-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .tesouro-page__layout { grid-template-columns: 1fr; }
}

.tesouro-page__form-col,
.tesouro-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.tesouro-page__form-panel { width: 100%; }

.tesouro-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.tesouro-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.tesouro-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.tesouro-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.tesouro-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tesouro-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

.tesouro-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.tesouro-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .tesouro-page__hero { grid-template-columns: 1fr; }
}

.tesouro-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.tesouro-page__results-section { margin-top: var(--space-6, 24px); }

.tesouro-page__results-main,
.tesouro-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.tesouro-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.tesouro-page__hint {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

.tesouro-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.tesouro-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}

.tesouro-page__breakdown-row--deduction { color: var(--color-text-secondary); }

.tesouro-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
}

.tesouro-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}
</style>
