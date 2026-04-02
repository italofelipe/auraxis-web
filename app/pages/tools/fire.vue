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
  NSelect,
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
  FIRE_TABLE_YEAR,
  FIRE_VARIANTS,
  calculateFire,
  createDefaultFireFormState,
  validateFireForm,
  type FireFormState,
  type FireResult,
} from "~/features/tools/model/fire";
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
  title: t("fire.seo.title"),
  description: t("fire.seo.description"),
  ogTitle: t("fire.seo.ogTitle"),
  ogDescription: t("fire.seo.ogDescription"),
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
  useCalculatorFormState<FireFormState>(createDefaultFireFormState);

const result = ref<FireResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

// ─── Variant select options ───────────────────────────────────────────────────

const variantOptions = computed(() =>
  FIRE_VARIANTS.map((v) => ({
    label: t(`fire.variants.${v}`),
    value: v,
  })),
);

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
  const targetLine = result.value.chartData.map(() => result.value!.selectedVariant.requiredPatrimony);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ seriesName: string; value: number }>): string =>
        params.map((p) => `${p.seriesName}: ${formatBrl(p.value)}`).join("<br/>"),
    },
    legend: {
      data: [
        t("fire.results.chart.patrimony"),
        t("fire.results.chart.target"),
      ],
    },
    xAxis: {
      type: "category",
      data: ages,
      name: t("fire.results.chart.xAxis"),
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (val: number): string => formatBrl(val) },
    },
    series: [
      {
        name: t("fire.results.chart.patrimony"),
        type: "line",
        data: patrimonyData,
        smooth: true,
        areaStyle: { opacity: 0.1 },
      },
      {
        name: t("fire.results.chart.target"),
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
  const errors = validateFireForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`fire.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateFire(form.value);
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
      label: t("fire.results.monthlyContribution"),
      value: formatBrl(result.value.selectedVariant.requiredMonthlyContribution),
    },
    {
      label: t("fire.results.coastNumber"),
      value: formatBrl(result.value.coastNumber),
    },
    {
      label: t("fire.results.realReturn"),
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
      name: t("fire.simulation.defaultName", {
        variant: t(`fire.variants.${form.value.variant}`),
        retirementAge: form.value.retirementAge,
      }),
      toolSlug: "fire",
      inputs: { ...form.value },
      result: {
        requiredPatrimony: result.value.selectedVariant.requiredPatrimony,
        requiredMonthlyContribution: result.value.selectedVariant.requiredMonthlyContribution,
        coastNumber: result.value.coastNumber,
        monthsToRetirement: result.value.monthsToRetirement,
        realReturnPct: result.value.realReturnPct,
      },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "fire/save-simulation" });
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
      name: t("fire.simulation.goalName", {
        variant: t(`fire.variants.${form.value.variant}`),
        retirementAge: form.value.retirementAge,
      }),
      target_amount: result.value.selectedVariant.requiredPatrimony,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "fire/add-as-goal" });
  }
}

const isBridging = computed(
  () => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value,
);

const isSaved = computed(() => savedSimulationId.value !== null);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="fire-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="fire-page fire-page--authenticated">
      <div class="fire-page__layout">
        <!-- Form column -->
        <div class="fire-page__form-col">
          <UiPageHeader
            :title="t('fire.hero.title')"
            :subtitle="t('fire.hero.subtitle')"
          />

          <UiGlassPanel class="fire-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('fire.form.title')">
                <NFormItem :label="t('fire.form.variant')">
                  <NSelect
                    :value="form.variant"
                    :options="variantOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ variant: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.currentAge')">
                  <NInputNumber
                    :value="form.currentAge"
                    :min="18"
                    :max="80"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentAge: v ?? 30 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.retirementAge')">
                  <NInputNumber
                    :value="form.retirementAge"
                    :min="19"
                    :max="100"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ retirementAge: v ?? 45 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.monthlyExpenses')">
                  <NInputNumber
                    :value="form.monthlyExpenses"
                    :placeholder="t('fire.form.expensesPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthlyExpenses: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.currentPatrimony')">
                  <NInputNumber
                    :value="form.currentPatrimony"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentPatrimony: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.expectedReturnPct')">
                  <NInputNumber
                    :value="form.expectedReturnPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ expectedReturnPct: v ?? 8 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fire.form.ipcaPct')">
                  <NInputNumber
                    :value="form.ipcaPct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ ipcaPct: v ?? 4.5 })"
                  />
                  <p class="fire-page__hint">{{ t('fire.form.ipcaHint') }}</p>
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="fire-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('fire.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('fire.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="fire-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('fire.results.requiredPatrimony')"
              :value="formatBrl(result.selectedVariant.requiredPatrimony)"
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
                {{ isSaved ? t('fire.actions.saved') : t('fire.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                type="warning"
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('fire.actions.goalAdded') : t('fire.actions.addAsGoal') }}
              </NButton>

              <NThing
                v-if="isAuthenticated && !hasPremiumAccess"
                :title="t('fire.premiumCta.title')"
                :description="t('fire.premiumCta.description')"
              >
                <template #footer>
                  <NButton size="small" type="warning" @click="router.push('/subscription')">
                    {{ t('fire.premiumCta.upgrade') }}
                  </NButton>
                </template>
              </NThing>
            </NSpace>
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- All variants comparison -->
            <UiSurfaceCard>
              <p class="fire-page__section-title">{{ t('fire.results.variantsTitle') }}</p>
              <div class="fire-page__breakdown">
                <div
                  v-for="milestone in result.allVariants"
                  :key="milestone.variant"
                  class="fire-page__breakdown-row"
                >
                  <span>{{ t(`fire.variants.${milestone.variant}`) }}</span>
                  <span>{{ formatBrl(milestone.requiredPatrimony) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Chart -->
            <UiSurfaceCard>
              <p class="fire-page__section-title">{{ t('fire.results.chart.title') }}</p>
              <VChart :option="chartOption" style="height: 240px" autoresize />
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('fire.disclaimer.note', { year: FIRE_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="fire-page">
    <header class="fire-page__header">
      <div class="fire-page__brand">
        <span class="fire-page__brand-mark">Auraxis</span>
        <span class="fire-page__brand-copy">{{ t('fire.header.publicTool') }}</span>
      </div>
      <div class="fire-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">{{ t('fire.header.otherTools') }}</NButton>
        <NButton type="primary" @click="router.push('/register')">{{ t('fire.header.createAccount') }}</NButton>
      </div>
    </header>

    <main class="fire-page__content">
      <section class="fire-page__hero">
        <div class="fire-page__hero-copy">
          <NTag round type="warning">{{ t('fire.hero.badge') }}</NTag>
          <UiPageHeader
            :title="t('fire.hero.title')"
            :subtitle="t('fire.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="fire-page__form-panel">
          <NForm @submit.prevent="handleCalculate">
            <CalculatorFormSection :title="t('fire.form.title')">
              <NFormItem :label="t('fire.form.variant')">
                <NSelect
                  :value="form.variant"
                  :options="variantOptions"
                  style="width: 100%"
                  @update:value="(v) => patch({ variant: v })"
                />
              </NFormItem>

              <NFormItem :label="t('fire.form.currentAge')">
                <NInputNumber
                  :value="form.currentAge"
                  :min="18"
                  :max="80"
                  :precision="0"
                  style="width: 100%"
                  @update:value="(v) => patch({ currentAge: v ?? 30 })"
                />
              </NFormItem>

              <NFormItem :label="t('fire.form.retirementAge')">
                <NInputNumber
                  :value="form.retirementAge"
                  :min="19"
                  :precision="0"
                  style="width: 100%"
                  @update:value="(v) => patch({ retirementAge: v ?? 45 })"
                />
              </NFormItem>

              <NFormItem :label="t('fire.form.monthlyExpenses')">
                <NInputNumber
                  :value="form.monthlyExpenses"
                  :placeholder="t('fire.form.expensesPlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ monthlyExpenses: v })"
                />
              </NFormItem>

              <NFormItem :label="t('fire.form.currentPatrimony')">
                <NInputNumber
                  :value="form.currentPatrimony"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ currentPatrimony: v ?? 0 })"
                />
              </NFormItem>

              <NFormItem :label="t('fire.form.expectedReturnPct')">
                <NInputNumber
                  :value="form.expectedReturnPct"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  @update:value="(v) => patch({ expectedReturnPct: v ?? 8 })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top:12px">
              {{ validationError }}
            </NAlert>

            <div class="fire-page__form-actions">
              <NButton v-if="isDirty" quaternary @click="handleReset">
                {{ t('fire.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('fire.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="fire-page__results-section">
        <div class="fire-page__layout">
          <div class="fire-page__results-main">
            <!-- All variants comparison (guest) -->
            <UiSurfaceCard>
              <p class="fire-page__section-title">{{ t('fire.results.variantsTitle') }}</p>
              <div class="fire-page__breakdown">
                <div
                  v-for="milestone in result.allVariants"
                  :key="milestone.variant"
                  class="fire-page__breakdown-row"
                >
                  <span>{{ t(`fire.variants.${milestone.variant}`) }}</span>
                  <span>{{ formatBrl(milestone.requiredPatrimony) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('fire.disclaimer.note', { year: FIRE_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </div>

          <div class="fire-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t('fire.results.requiredPatrimony')"
                :value="formatBrl(result.selectedVariant.requiredPatrimony)"
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
.fire-root { display: contents; }

.fire-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.fire-page--authenticated { padding: var(--space-6, 24px); }

.fire-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) { .fire-page__layout { grid-template-columns: 1fr; } }

.fire-page__form-col,
.fire-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.fire-page__form-panel { width: 100%; }

.fire-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.fire-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.fire-page__brand { display: flex; align-items: center; gap: var(--space-2, 8px); }

.fire-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary);
}

.fire-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fire-page__header-actions { display: flex; gap: var(--space-2, 8px); }

.fire-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.fire-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) { .fire-page__hero { grid-template-columns: 1fr; } }

.fire-page__hero-copy { display: flex; flex-direction: column; gap: var(--space-3, 12px); }

.fire-page__results-section { margin-top: var(--space-6, 24px); }

.fire-page__results-main,
.fire-page__results-aside { display: flex; flex-direction: column; gap: var(--space-4, 16px); }

.fire-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.fire-page__hint {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

.fire-page__breakdown { display: flex; flex-direction: column; gap: var(--space-2, 8px); }

.fire-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}
</style>
