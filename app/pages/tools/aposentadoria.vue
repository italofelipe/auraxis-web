<script setup lang="ts">
import { computed, ref } from "vue";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NTag,
  NThing,
} from "naive-ui";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  APOSENTADORIA_TABLE_YEAR,
  calculateAposentadoria,
  createDefaultAposentadoriaFormState,
  validateAposentadoriaForm,
  type AposentadoriaFormState,
  type AposentadoriaResult,
} from "~/features/tools/model/aposentadoria";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

// Register ECharts components
use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

definePageMeta({ layout: false });

const { t, n } = useI18n();
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("aposentadoria.seo.title"),
  description: t("aposentadoria.seo.description"),
  ogTitle: t("aposentadoria.seo.ogTitle"),
  ogDescription: t("aposentadoria.seo.ogDescription"),
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

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<AposentadoriaFormState>(createDefaultAposentadoriaFormState);

const result = ref<AposentadoriaResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

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

// ─── Chart ────────────────────────────────────────────────────────────────────

const chartOption = computed(() => {
  if (!result.value) { return {}; }

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
  };
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
      name: t("aposentadoria.simulation.defaultName", {
        retirementAge: form.value.retirementAge,
        year: new Date().getFullYear(),
      }),
      toolSlug: "aposentadoria",
      inputs: { ...form.value },
      result: {
        requiredPatrimony: result.value.requiredPatrimony,
        requiredMonthlyContribution: result.value.requiredMonthlyContribution,
        monthsToRetirement: result.value.monthsToRetirement,
        realReturnPct: result.value.realReturnPct,
      },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "aposentadoria/save-simulation" });
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
 * Saves the simulation then creates a goal from the required patrimony.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }

  await ensureSimulationSaved();

  try {
    await createGoalMutation.mutateAsync({
      name: t("aposentadoria.simulation.goalName", {
        retirementAge: form.value.retirementAge,
      }),
      target_amount: result.value.requiredPatrimony,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "aposentadoria/add-as-goal" });
  }
}

const isBridging = computed(
  () => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value,
);

const isSaved = computed(() => savedSimulationId.value !== null);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="apos-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
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
              <VChart :option="chartOption" style="height: 240px" autoresize />
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
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="apos-page">
    <header class="apos-page__header">
      <div class="apos-page__brand">
        <span class="apos-page__brand-mark">Auraxis</span>
        <span class="apos-page__brand-copy">{{ t('aposentadoria.header.publicTool') }}</span>
      </div>
      <div class="apos-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">{{ t('aposentadoria.header.otherTools') }}</NButton>
        <NButton type="primary" @click="router.push('/register')">{{ t('aposentadoria.header.createAccount') }}</NButton>
      </div>
    </header>

    <main class="apos-page__content">
      <section class="apos-page__hero">
        <div class="apos-page__hero-copy">
          <NTag round type="warning">{{ t('aposentadoria.hero.badge') }}</NTag>
          <UiPageHeader
            :title="t('aposentadoria.hero.title')"
            :subtitle="t('aposentadoria.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="apos-page__form-panel">
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
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top:12px">
              {{ validationError }}
            </NAlert>

            <div class="apos-page__form-actions">
              <NButton v-if="isDirty" quaternary @click="handleReset">
                {{ t('aposentadoria.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('aposentadoria.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="apos-page__results-section">
        <div class="apos-page__layout">
          <div class="apos-page__results-main">
            <!-- Sensitivity (guest) -->
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

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('aposentadoria.disclaimer.note', { year: APOSENTADORIA_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </div>

          <div class="apos-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t('aposentadoria.results.requiredPatrimony')"
                :value="formatBrl(result.requiredPatrimony)"
                :metrics="summaryMetrics"
              />
            </UiStickySummaryCard>

            <!-- Guest CTA -->
            <ToolGuestCta />
          </div>
        </div>
      </section>
    </main>
  </div>
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
