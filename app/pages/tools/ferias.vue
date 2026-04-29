<script setup lang="ts">
import { computed } from "vue";
import {
  NAlert,
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NThing,
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";

import {
  BR_TAX_TABLE_YEAR,
  MIN_REST_DAYS_WITH_ABONO,
  VACATION_DAYS_OPTIONS,
  calculateFerias,
  createDefaultFeriasFormState,
  validateFeriasForm,
  type FeriasFormState,
  type FeriasResult,
  type VacationDaysOption,
} from "~/features/tools/model/ferias";
import { useToolPage } from "~/features/tools/composables/use-tool-page";
import { useToolPageStructuredData } from "~/features/tools/composables/useToolPageStructuredData";
import { FERIAS_FAQS } from "~/features/tools/content/ferias-faqs";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const {
  t, router,
  isAuthenticated, hasPremiumAccess, formatBrl,
  form, validationError, isDirty, patch, reset, setValidationError,
  result, savedSimulationId,
  saveSimulationMutation,
  handleSaveSimulation,
} = useToolPage<FeriasFormState, FeriasResult>({
  createDefaultState: createDefaultFeriasFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "vacation",
    ruleVersion: "2026.04",
    metadata: { label: t("ferias.simulation.defaultName", { year: new Date().getFullYear() }) },
    inputs: { ...form },
    result: { ...result },
  }),
});

useSeoMeta({
  title: t("ferias.seo.title"),
  description: t("ferias.seo.description"),
  ogTitle: t("ferias.seo.ogTitle"),
  ogDescription: t("ferias.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

useToolPageStructuredData({
  slug: "ferias",
  name: t("ferias.seo.title"),
  description: t("ferias.seo.description"),
  faqs: FERIAS_FAQS,
});

// ─── Vacation days select options ─────────────────────────────────────────────

const vacationDaysOptions = computed(() =>
  VACATION_DAYS_OPTIONS.map((days) => ({
    label: t(`ferias.form.vacationDaysOptions.${days}`),
    value: days,
  })),
);

/**
 * True when the abono option is disabled due to insufficient rest days.
 */
const abonoDisabled = computed<boolean>(
  () => form.value.vacationDays < MIN_REST_DAYS_WITH_ABONO,
);

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateFeriasForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`ferias.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateFerias(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

/**
 * Handles vacation days change and resets abono when below minimum rest days.
 *
 * @param days Selected vacation days value.
 */
function handleVacationDaysChange(days: VacationDaysOption): void {
  const newAbono = days < MIN_REST_DAYS_WITH_ABONO ? false : form.value.abonoEnabled;
  patch({ vacationDays: days, abonoEnabled: newAbono });
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("ferias.results.totalGross"),
      value: formatBrl(result.value.totalGross),
    },
    {
      label: t("ferias.results.inss"),
      value: `− ${formatBrl(result.value.inss)}`,
    },
    {
      label: t("ferias.results.irrf"),
      value: result.value.irrf > 0
        ? `− ${formatBrl(result.value.irrf)}`
        : formatBrl(0),
    },
    {
      label: t("ferias.results.effectiveRate"),
      value: `${result.value.effectiveRate.toFixed(1)}%`,
    },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="ferias-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="ferias-page ferias-page--authenticated">
      <div class="ferias-page__layout">
        <!-- Form column -->
        <div class="ferias-page__form-col">
          <UiPageHeader
            :title="t('ferias.hero.title')"
            :subtitle="t('ferias.hero.subtitle')"
          />

          <UiGlassPanel class="ferias-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('ferias.form.title')">
                <NFormItem :label="t('ferias.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('ferias.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('ferias.form.vacationDays') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('ferias.form.vacationDaysTooltip') }}
                    </NTooltip>
                  </template>
                  <NSelect
                    :value="form.vacationDays"
                    :options="vacationDaysOptions"
                    style="width: 100%"
                    @update:value="handleVacationDaysChange"
                  />
                </NFormItem>

                <NFormItem>
                  <NCheckbox
                    :checked="form.abonoEnabled"
                    :disabled="abonoDisabled"
                    @update:checked="(v) => patch({ abonoEnabled: v })"
                  >
                    {{ t('ferias.form.abonoEnabled') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('ferias.form.abonoEnabledTooltip') }}
                    </NTooltip>
                  </NCheckbox>
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('ferias.form.overtimeAverage') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('ferias.form.overtimeAverageTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.overtimeAverage"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ overtimeAverage: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('ferias.form.dependents') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('ferias.form.dependentsTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.dependents"
                    :min="0"
                    :max="20"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ dependents: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="ferias-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('ferias.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('ferias.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="ferias-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('ferias.results.netTotal')"
              :value="formatBrl(result.netTotal)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Breakdown card -->
            <UiSurfaceCard>
              <div class="ferias-page__breakdown">
                <div class="ferias-page__breakdown-row">
                  <span>{{ t('ferias.results.vacationBasePay') }} ({{ result.vacationDays }}d)</span>
                  <span>{{ formatBrl(result.vacationBasePay) }}</span>
                </div>
                <div class="ferias-page__breakdown-row ferias-page__breakdown-row--bonus">
                  <span>{{ t('ferias.results.constitutionalThird') }}</span>
                  <span>+ {{ formatBrl(result.constitutionalThird) }}</span>
                </div>
                <div class="ferias-page__breakdown-row ferias-page__breakdown-row--subtotal">
                  <span>{{ t('ferias.results.vacationGross') }}</span>
                  <span>{{ formatBrl(result.vacationGross) }}</span>
                </div>
                <div v-if="result.abonoEnabled" class="ferias-page__breakdown-row ferias-page__breakdown-row--abono">
                  <span>{{ t('ferias.results.abonoValue') }}</span>
                  <span>+ {{ formatBrl(result.abonoValue) }}</span>
                </div>
                <div class="ferias-page__breakdown-row ferias-page__breakdown-row--total">
                  <span>{{ t('ferias.results.totalGross') }}</span>
                  <span class="ferias-page__value--gross">{{ formatBrl(result.totalGross) }}</span>
                </div>
                <div class="ferias-page__breakdown-row ferias-page__breakdown-row--deduction">
                  <span>{{ t('ferias.results.inss') }}</span>
                  <span class="ferias-page__value--negative">− {{ formatBrl(result.inss) }}</span>
                </div>
                <div v-if="result.irrf > 0" class="ferias-page__breakdown-row ferias-page__breakdown-row--deduction">
                  <span>{{ t('ferias.results.irrf') }}</span>
                  <span class="ferias-page__value--negative">− {{ formatBrl(result.irrf) }}</span>
                </div>
                <div class="ferias-page__breakdown-row ferias-page__breakdown-row--net">
                  <span>{{ t('ferias.results.netTotal') }}</span>
                  <span class="ferias-page__value--positive">{{ formatBrl(result.netTotal) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Best month tip -->
            <UiSurfaceCard>
              <p class="ferias-page__tip">
                {{ t('ferias.results.bestMonthNote') }}
              </p>
            </UiSurfaceCard>

            <ToolSaveResult
              intent="receivable"
              :label="t('ferias.hero.title')"
              :amount="result.netTotal"
            />

            <!-- Action bar -->
            <UiSurfaceCard class="ferias-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('ferias.actions.saved') : t('ferias.actions.save') }}
                </NButton>

                <NThing
                  v-if="!hasPremiumAccess"
                  :title="t('thirteenthSalary.premiumCta.title')"
                  :description="t('thirteenthSalary.premiumCta.description')"
                >
                  <template #footer>
                    <NButton size="small" type="warning" @click="router.push('/subscription')">
                      {{ t('thirteenthSalary.premiumCta.upgrade') }}
                    </NButton>
                  </template>
                </NThing>
              </NSpace>
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <p class="ferias-page__disclaimer">
                {{ t('ferias.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="ferias-page__disclaimer">
                {{ t('ferias.disclaimer.abonoExempt') }}
              </p>
              <p class="ferias-page__disclaimer">
                {{ t('ferias.disclaimer.notLegal') }}
              </p>
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
/* ── Root & page ─────────────────────────────────────────────────────────────── */
.ferias-root {
  display: contents;
}

.ferias-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.ferias-page--authenticated {
  padding: var(--space-6, 24px);
}

.ferias-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .ferias-page__layout {
    grid-template-columns: 1fr;
  }
}

.ferias-page__form-col,
.ferias-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.ferias-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.ferias-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.ferias-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.ferias-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.ferias-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.ferias-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ferias-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.ferias-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.ferias-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .ferias-page__hero {
    grid-template-columns: 1fr;
  }
}

.ferias-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.ferias-page__results-section {
  margin-top: var(--space-6, 24px);
}

.ferias-page__results-main,
.ferias-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.ferias-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Breakdown ───────────────────────────────────────────────────────────────── */
.ferias-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.ferias-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.ferias-page__breakdown-row--bonus {
  color: var(--color-semantic-positive, #22c55e);
}

.ferias-page__breakdown-row--abono {
  color: var(--color-brand-600, #0284c7);
}

.ferias-page__breakdown-row--subtotal {
  border-top: 1px dashed var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-semibold, 600);
}

.ferias-page__breakdown-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.ferias-page__breakdown-row--deduction {
  color: var(--color-text-secondary);
}

.ferias-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.ferias-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.ferias-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

.ferias-page__value--gross {
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

/* ── Tip & disclaimer ────────────────────────────────────────────────────────── */
.ferias-page__tip {
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.ferias-page__disclaimer {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1, 4px) 0;
  line-height: 1.5;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.ferias-page__action-bar {
  flex-shrink: 0;
}
</style>
