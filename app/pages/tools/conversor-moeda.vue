<script setup lang="ts">
import { computed } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NSpin,
} from "naive-ui";

import { useBrapiCurrencyQuery } from "~/features/tools/queries/use-brapi-currency-query";
import {
  CURRENCY_PAIRS,
  calculateConversorMoeda,
  createDefaultConversorMoedaFormState,
  validateConversorMoedaForm,
  type ConversorMoedaFormState,
  type ConversorMoedaResult,
} from "~/features/tools/model/conversor-moeda";
import { useToolPage } from "~/features/tools/composables/use-tool-page";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();

useSeoMeta({
  title: t("conversorMoeda.seo.title"),
  description: t("conversorMoeda.seo.description"),
  ogTitle: t("conversorMoeda.seo.ogTitle"),
  ogDescription: t("conversorMoeda.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const {
  isAuthenticated,
  hasPremiumAccess,
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
} = useToolPage<ConversorMoedaFormState, ConversorMoedaResult>({
  createDefaultState: createDefaultConversorMoedaFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "currency-converter",
    ruleVersion: "2026.04",
    metadata: { label: t("conversorMoeda.simulation.defaultName", { pair: form.pair, year: new Date().getFullYear() }) },
    inputs: { ...form },
    result: { ...result },
  }),
  getGoalPayload: ({ result, form: rawForm, t }) => {
    const form = rawForm as ConversorMoedaFormState;
    return {
      name: t("conversorMoeda.simulation.goalName", { pair: form.pair }),
      target_amount: result.convertedAmount,
    };
  },
});

// ─── BRAPI query ──────────────────────────────────────────────────────────────

const pairs = computed(() => [form.value.pair]);
const currencyQuery = useBrapiCurrencyQuery(pairs);

/**
 * The live BRAPI quote for the currently selected currency pair, or null.
 */
const liveQuote = computed(
  () => currencyQuery.data.value?.find(
    (c) => `${c.fromCurrency}-${c.toCurrency}` === form.value.pair,
  ) ?? null,
);

const isLoadingQuote = computed(() => currencyQuery.isPending.value);
const hasBrapiError = computed(() => currencyQuery.isError.value);
const hasLiveQuote = computed(() => liveQuote.value !== null);

// ─── Currency pair options ────────────────────────────────────────────────────

const pairOptions = computed(() =>
  CURRENCY_PAIRS.map((p) => ({ label: p, value: p })),
);

const directionOptions = computed(() => [
  { label: t("conversorMoeda.form.directionBuy"), value: "buy" },
  { label: t("conversorMoeda.form.directionSell"), value: "sell" },
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a number with up to 4 decimal places (for currency amounts).
 *
 * @param value - Number to format.
 * @returns Formatted string.
 */
function formatAmount(value: number): string {
  return n(value, { maximumFractionDigits: 4, minimumFractionDigits: 2 });
}

/**
 * Formats a rate with 4 decimal places.
 *
 * @param value - Rate to format.
 * @returns Formatted string.
 */
function formatRate(value: number): string {
  return n(value, { maximumFractionDigits: 4, minimumFractionDigits: 4 });
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the conversion calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateConversorMoedaForm(form.value, hasLiveQuote.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`conversorMoeda.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateConversorMoeda(form.value, liveQuote.value);
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
      label: t("conversorMoeda.results.rate"),
      value: formatRate(result.value.rate),
    },
    {
      label: t("conversorMoeda.results.bid"),
      value: formatRate(result.value.bid),
    },
    {
      label: t("conversorMoeda.results.ask"),
      value: formatRate(result.value.ask),
    },
    {
      label: t("conversorMoeda.results.pctChange"),
      value: `${result.value.pctChange.toFixed(2)}%`,
    },
    {
      label: t("conversorMoeda.results.source"),
      value: t(`conversorMoeda.results.source_${result.value.source}`),
    },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="conversor-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="conversor-page conversor-page--authenticated">
      <div class="conversor-page__layout">
        <!-- Form column -->
        <div class="conversor-page__form-col">
          <UiPageHeader
            :title="t('conversorMoeda.hero.title')"
            :subtitle="t('conversorMoeda.hero.subtitle')"
          />

          <UiGlassPanel class="conversor-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('conversorMoeda.form.title')">
                <NFormItem :label="t('conversorMoeda.form.pair')">
                  <NSelect
                    :value="form.pair"
                    :options="pairOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ pair: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('conversorMoeda.form.direction')">
                  <NSelect
                    :value="form.direction"
                    :options="directionOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ direction: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('conversorMoeda.form.amount')">
                  <NInputNumber
                    :value="form.amount"
                    :placeholder="t('conversorMoeda.form.amountPlaceholder')"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ amount: v })"
                  />
                </NFormItem>

                <!-- Manual rate fallback: shown when BRAPI has an error -->
                <NFormItem
                  v-if="hasBrapiError"
                  :label="t('conversorMoeda.form.manualRate')"
                >
                  <NInputNumber
                    :value="form.manualRate"
                    :placeholder="t('conversorMoeda.form.manualRatePlaceholder')"
                    :min="0"
                    :precision="4"
                    style="width: 100%"
                    @update:value="(v) => patch({ manualRate: v })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <!-- BRAPI error fallback alert -->
              <NAlert v-if="hasBrapiError" type="warning" style="margin-top:12px" data-testid="brapi-error-alert">
                {{ t('conversorMoeda.alerts.brapiUnavailable') }}
              </NAlert>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="conversor-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('conversorMoeda.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('conversorMoeda.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="conversor-page__results-col">
          <!-- Loading state while BRAPI fetches -->
          <UiSurfaceCard v-if="isLoadingQuote" class="conversor-page__loading" data-testid="loading-spinner">
            <NSpin />
            <span>{{ t('conversorMoeda.loading') }}</span>
          </UiSurfaceCard>

          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="`${result.convertedAmount > 0 ? result.fromCurrency : ''} → ${result.toCurrency}`"
              :value="`${formatAmount(result.convertedAmount)} ${result.toCurrency}`"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning" data-testid="disclaimer-alert">
                {{ t('conversorMoeda.disclaimer.indicativeRate') }}
              </NAlert>
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="conversor-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('conversorMoeda.actions.saved') : t('conversorMoeda.actions.save') }}
                </NButton>

                <NButton
                  v-if="hasPremiumAccess"
                  block
                  type="warning"
                  :loading="createGoalMutation.isPending.value"
                  :disabled="goalAdded || createGoalMutation.isPending.value"
                  data-testid="add-as-goal-btn"
                  @click="handleAddAsGoal"
                >
                  {{ goalAdded ? t('conversorMoeda.actions.goalAdded') : t('conversorMoeda.actions.addAsGoal') }}
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
.conversor-root {
  display: contents;
}

.conversor-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.conversor-page--authenticated {
  padding: var(--space-6, 24px);
}

.conversor-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .conversor-page__layout {
    grid-template-columns: 1fr;
  }
}

.conversor-page__form-col,
.conversor-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.conversor-page__form-panel {
  width: 100%;
}

/* ── Loading ─────────────────────────────────────────────────────────────────── */
.conversor-page__loading {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm, 13px);
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.conversor-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.conversor-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.conversor-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.conversor-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.conversor-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.conversor-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.conversor-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.conversor-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .conversor-page__hero {
    grid-template-columns: 1fr;
  }
}

.conversor-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.conversor-page__results-section {
  margin-top: var(--space-6, 24px);
}

.conversor-page__results-main,
.conversor-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.conversor-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Breakdown ───────────────────────────────────────────────────────────────── */
.conversor-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.conversor-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.conversor-page__breakdown-row--main {
  border-bottom: 1px solid var(--color-outline-subtle);
  padding-bottom: var(--space-2, 8px);
  margin-bottom: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-md, 15px);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.conversor-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.conversor-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.conversor-page__action-bar {
  flex-shrink: 0;
}
</style>
