<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  useMessage,
} from "naive-ui";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useBrapiFiiQuoteQuery } from "~/features/tools/queries/use-brapi-fii-quote-query";
import {
  calculateFii,
  createDefaultFiiFormState,
  validateFiiForm,
  type FiiFormState,
  type FiiResult,
} from "~/features/tools/model/fii";
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
  title: t("fii.seo.title"),
  description: t("fii.seo.description"),
  ogTitle: t("fii.seo.ogTitle"),
  ogDescription: t("fii.seo.ogDescription"),
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
  useCalculatorFormState<FiiFormState>(createDefaultFiiFormState);

const result = ref<FiiResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalCreated = ref(false);

// ─── BRAPI FII query ──────────────────────────────────────────────────────────

const tickerRef = computed(() => form.value.ticker.trim().toUpperCase());
const fiiQuery = useBrapiFiiQuoteQuery(tickerRef);

const isLoadingQuote = computed(() => fiiQuery.isPending.value);
const hasBrapiError = computed(() => fiiQuery.isError.value);
const liveQuote = computed(() => fiiQuery.data.value ?? null);

// ─── History months options ───────────────────────────────────────────────────

const historyMonthsOptions = computed(() =>
  [3, 6, 12, 24].map((m) => ({
    label: t("fii.form.historyMonthsOption", { months: m }),
    value: m,
  })),
);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a number as BRL currency string.
 *
 * @param value - Number to format.
 * @returns Formatted BRL string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

/**
 * Formats a percentage with 2 decimal places.
 *
 * @param value - Percentage value.
 * @returns Formatted percentage string.
 */
function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the FII calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateFiiForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`fii.${first.messageKey}`) : null);
    return;
  }
  if (!liveQuote.value) {
    setValidationError(t("fii.errors.noQuoteAvailable"));
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalCreated.value = false;
  result.value = calculateFii(form.value, liveQuote.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalCreated.value = false;
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  const items = [
    { label: t("fii.results.currentPrice"), value: formatBrl(result.value.currentPrice) },
    { label: t("fii.results.lastDividend"), value: formatBrl(result.value.lastDividend) },
    { label: t("fii.results.avgDividend"), value: formatBrl(result.value.avgDividend12m) },
    { label: t("fii.results.dividendYield"), value: formatPct(result.value.dividendYield) },
    { label: t("fii.results.vsCdi"), value: formatPct(result.value.vsCdiPremium) },
  ];
  if (result.value.yieldOnCost !== null) {
    items.push({ label: t("fii.results.yieldOnCost"), value: formatPct(result.value.yieldOnCost) });
  }
  return items;
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
      name: t("fii.simulation.defaultName", { ticker: form.value.ticker, year: new Date().getFullYear() }),
      toolSlug: "fii_calculator",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "fii/save-simulation" });
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

/**
 * Creates a financial goal using the FII annual income or market cap as target.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }
  const targetAmount = result.value.annualIncome
    ?? result.value.currentPrice * (form.value.shares ?? 1);
  try {
    await createGoalMutation.mutateAsync({
      name: t("fii.simulation.goalName", { ticker: form.value.ticker }),
      target_amount: targetAmount,
    });
    goalCreated.value = true;
  } catch (err) {
    captureException(err, { context: "fii/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="fii-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="fii-page fii-page--authenticated">
      <div class="fii-page__layout">
        <!-- Form column -->
        <div class="fii-page__form-col">
          <UiPageHeader
            :title="t('fii.hero.title')"
            :subtitle="t('fii.hero.subtitle')"
          />

          <UiGlassPanel class="fii-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('fii.form.title')">
                <NFormItem :label="t('fii.form.ticker')">
                  <NInput
                    :value="form.ticker"
                    :placeholder="t('fii.form.tickerPlaceholder')"
                    style="width: 100%"
                    @update:value="(v) => patch({ ticker: v.toUpperCase() })"
                  />
                </NFormItem>

                <NFormItem :label="t('fii.form.shares')">
                  <NInputNumber
                    :value="form.shares"
                    :placeholder="t('fii.form.sharesPlaceholder')"
                    :min="0"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ shares: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('fii.form.avgPurchasePrice')">
                  <NInputNumber
                    :value="form.avgPurchasePrice"
                    :placeholder="t('fii.form.avgPurchasePricePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ avgPurchasePrice: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('fii.form.cdiRate')">
                  <NInputNumber
                    :value="form.cdiRatePct"
                    :min="0"
                    :max="100"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ cdiRatePct: v ?? 10.65 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fii.form.historyMonths')">
                  <NSelect
                    :value="form.historyMonths"
                    :options="historyMonthsOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ historyMonths: v })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <!-- BRAPI loading state -->
              <div v-if="isLoadingQuote" class="fii-page__loading" data-testid="loading-spinner">
                <NSpin />
                <span>{{ t('fii.loading') }}</span>
              </div>

              <!-- BRAPI error -->
              <NAlert v-if="hasBrapiError" type="warning" style="margin-top:12px" data-testid="brapi-error-alert">
                {{ t('fii.alerts.brapiUnavailable') }}
              </NAlert>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="fii-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('fii.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('fii.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="fii-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('fii.results.dividendYield')"
              :value="formatPct(result.dividendYield)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Results breakdown -->
            <UiSurfaceCard>
              <p class="fii-page__section-title">{{ t('fii.results.title') }}</p>
              <div class="fii-page__breakdown">
                <div class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.currentPrice') }}</span>
                  <span>{{ formatBrl(result.currentPrice) }}</span>
                </div>
                <div class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.lastDividend') }}</span>
                  <span>{{ formatBrl(result.lastDividend) }}</span>
                </div>
                <div class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.avgDividend') }}</span>
                  <span>{{ formatBrl(result.avgDividend12m) }}</span>
                </div>
                <div class="fii-page__breakdown-row fii-page__breakdown-row--highlight">
                  <span>{{ t('fii.results.dividendYield') }}</span>
                  <span>{{ formatPct(result.dividendYield) }}</span>
                </div>
                <div v-if="result.yieldOnCost !== null" class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.yieldOnCost') }}</span>
                  <span>{{ formatPct(result.yieldOnCost) }}</span>
                </div>
                <div v-if="result.monthlyIncome !== null" class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.monthlyIncome') }}</span>
                  <span>{{ formatBrl(result.monthlyIncome) }}</span>
                </div>
                <div v-if="result.annualIncome !== null" class="fii-page__breakdown-row">
                  <span>{{ t('fii.results.annualIncome') }}</span>
                  <span>{{ formatBrl(result.annualIncome) }}</span>
                </div>
                <div class="fii-page__breakdown-row fii-page__breakdown-row--cdi">
                  <span>{{ t('fii.results.vsCdi') }}</span>
                  <span :class="result.isAboveCdi ? 'fii-page__value--positive' : 'fii-page__value--negative'">
                    {{ formatPct(result.vsCdiPremium) }}
                  </span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- CVM regulatory disclaimer (mandatory) -->
            <UiSurfaceCard>
              <NAlert type="error" data-testid="cvm-disclaimer">
                {{ t('fii.disclaimer.cvm') }}
              </NAlert>
            </UiSurfaceCard>

            <ToolSaveResult
              intent="goal"
              :label="t('fii.hero.title')"
              :amount="result.monthlyIncome ?? 0"
            />

            <!-- Action bar -->
            <UiSurfaceCard class="fii-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('fii.actions.saved') : t('fii.actions.save') }}
                </NButton>

                <NButton
                  v-if="hasPremiumAccess"
                  block
                  type="warning"
                  :loading="createGoalMutation.isPending.value"
                  :disabled="goalCreated || createGoalMutation.isPending.value"
                  data-testid="add-as-goal-btn"
                  @click="handleAddAsGoal"
                >
                  {{ goalCreated ? t('fii.actions.goalAdded') : t('fii.actions.addAsGoal') }}
                </NButton>
              </NSpace>
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
/* ── Root & page ──────────────────────────────────────────────────────────────── */
.fii-root {
  display: contents;
}

.fii-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.fii-page--authenticated {
  padding: var(--space-6, 24px);
}

.fii-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .fii-page__layout {
    grid-template-columns: 1fr;
  }
}

.fii-page__form-col,
.fii-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.fii-page__form-panel {
  width: 100%;
}

/* ── Loading ─────────────────────────────────────────────────────────────────── */
.fii-page__loading {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm, 13px);
  margin-top: var(--space-3, 12px);
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.fii-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.fii-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.fii-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.fii-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.fii-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fii-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.fii-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.fii-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .fii-page__hero {
    grid-template-columns: 1fr;
  }
}

.fii-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.fii-page__results-section {
  margin-top: var(--space-6, 24px);
}

.fii-page__results-main,
.fii-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.fii-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Breakdown ───────────────────────────────────────────────────────────────── */
.fii-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.fii-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.fii-page__breakdown-row--highlight {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-md, 15px);
}

.fii-page__breakdown-row--cdi {
  border-top: 1px dashed var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-semibold, 600);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.fii-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.fii-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.fii-page__action-bar {
  flex-shrink: 0;
}
</style>
