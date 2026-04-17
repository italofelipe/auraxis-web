<script setup lang="ts">
import { computed, ref } from "vue";
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
  useMessage,
} from "naive-ui";
import { Info } from "lucide-vue-next";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import {
  BR_TAX_TABLE_YEAR,
  TERMINATION_TYPES,
  calculateRescisao,
  createDefaultRescisaoFormState,
  validateRescisaoForm,
  type RescisaoFormState,
  type RescisaoResult,
  type TerminationType,
} from "~/features/tools/model/rescisao";
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
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("rescisao.seo.title"),
  description: t("rescisao.seo.description"),
  ogTitle: t("rescisao.seo.ogTitle"),
  ogDescription: t("rescisao.seo.ogDescription"),
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
  useCalculatorFormState<RescisaoFormState>(createDefaultRescisaoFormState);

const result = ref<RescisaoResult | null>(null);
const savedSimulationId = ref<string | null>(null);

// ─── Select options ───────────────────────────────────────────────────────────

const terminationTypeOptions = computed(() =>
  TERMINATION_TYPES.map((type) => ({
    label: t(`rescisao.form.terminationTypes.${type}`),
    value: type,
  })),
);

const monthsOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: t(`rescisao.form.months.${i + 1}`),
    value: i + 1,
  })),
);

const vacationMonthsOptions = computed(() => [
  { label: t("rescisao.form.vacationMonths.0"), value: 0 },
  ...Array.from({ length: 11 }, (_, i) => ({
    label: t(`rescisao.form.months.${i + 1}`),
    value: i + 1,
  })),
]);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();

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

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateRescisaoForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`rescisao.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateRescisao(form.value);
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
 * Handles termination type change and resets fields not applicable.
 *
 * @param type Selected termination type.
 */
function handleTerminationTypeChange(type: TerminationType): void {
  patch({ terminationType: type });
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("rescisao.results.totalGross"),
      value: formatBrl(result.value.totalGross),
    },
    {
      label: t("rescisao.results.inss"),
      value: `− ${formatBrl(result.value.inss)}`,
    },
    {
      label: t("rescisao.results.irrf"),
      value: result.value.irrf > 0
        ? `− ${formatBrl(result.value.irrf)}`
        : formatBrl(0),
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
      name: t("rescisao.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "rescisao_clt",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "rescisao/save-simulation" });
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
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="rescisao-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="rescisao-page rescisao-page--authenticated">
      <div class="rescisao-page__layout">
        <!-- Form column -->
        <div class="rescisao-page__form-col">
          <UiPageHeader
            :title="t('rescisao.hero.title')"
            :subtitle="t('rescisao.hero.subtitle')"
          />

          <UiGlassPanel class="rescisao-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('rescisao.form.title')">
                <NFormItem :label="t('rescisao.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('rescisao.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('rescisao.form.terminationType')">
                  <NSelect
                    :value="form.terminationType"
                    :options="terminationTypeOptions"
                    style="width: 100%"
                    @update:value="handleTerminationTypeChange"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('rescisao.form.yearsOfService') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.yearsOfServiceTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.yearsOfService"
                    :min="0"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ yearsOfService: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('rescisao.form.daysWorkedInLastMonth')">
                  <NInputNumber
                    :value="form.daysWorkedInLastMonth"
                    :min="1"
                    :max="31"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ daysWorkedInLastMonth: v ?? 30 })"
                  />
                </NFormItem>

                <NFormItem :label="t('rescisao.form.monthsFor13')">
                  <NSelect
                    :value="form.monthsFor13"
                    :options="monthsOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthsFor13: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('rescisao.form.monthsForVacation') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.monthsForVacationTooltip') }}
                    </NTooltip>
                  </template>
                  <NSelect
                    :value="form.monthsForVacation"
                    :options="vacationMonthsOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthsForVacation: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <NCheckbox
                    :checked="form.hasExpiredVacation"
                    @update:checked="(v) => patch({ hasExpiredVacation: v })"
                  >
                    {{ t('rescisao.form.hasExpiredVacation') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.hasExpiredVacationTooltip') }}
                    </NTooltip>
                  </NCheckbox>
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('rescisao.form.fgtsBalance') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.fgtsBalanceTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.fgtsBalance"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ fgtsBalance: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('rescisao.form.overtimeAverage') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.overtimeAverageTooltip') }}
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
                    {{ t('rescisao.form.dependents') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('rescisao.form.dependentsTooltip') }}
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

              <div class="rescisao-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('rescisao.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('rescisao.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="rescisao-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('rescisao.results.netTotal')"
              :value="formatBrl(result.netTotal)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Breakdown card -->
            <UiSurfaceCard>
              <div class="rescisao-page__breakdown">
                <div class="rescisao-page__breakdown-row">
                  <span>{{ t('rescisao.results.saldoSalario') }}</span>
                  <span>{{ formatBrl(result.saldoSalario) }}</span>
                </div>
                <div v-if="result.avisoPrevio > 0" class="rescisao-page__breakdown-row rescisao-page__breakdown-row--notice">
                  <span>{{ t('rescisao.results.avisoPrevio', { days: result.noticeDays }) }}</span>
                  <span>+ {{ formatBrl(result.avisoPrevio) }}</span>
                </div>
                <div v-if="result.decimoTerceiroProporcional > 0" class="rescisao-page__breakdown-row">
                  <span>{{ t('rescisao.results.decimoTerceiro') }}</span>
                  <span>+ {{ formatBrl(result.decimoTerceiroProporcional) }}</span>
                </div>
                <div v-if="result.feriasProporcionais > 0" class="rescisao-page__breakdown-row rescisao-page__breakdown-row--vacation">
                  <span>{{ t('rescisao.results.feriasProporcionais') }}</span>
                  <span>+ {{ formatBrl(result.feriasProporcionais) }}</span>
                </div>
                <div v-if="result.feriasVencidas > 0" class="rescisao-page__breakdown-row rescisao-page__breakdown-row--vacation">
                  <span>{{ t('rescisao.results.feriasVencidas') }}</span>
                  <span>+ {{ formatBrl(result.feriasVencidas) }}</span>
                </div>
                <div v-if="result.fgtsMulta > 0" class="rescisao-page__breakdown-row rescisao-page__breakdown-row--fgts">
                  <span>{{ t('rescisao.results.fgtsMulta') }}</span>
                  <span>+ {{ formatBrl(result.fgtsMulta) }}</span>
                </div>
                <div class="rescisao-page__breakdown-row rescisao-page__breakdown-row--total">
                  <span>{{ t('rescisao.results.totalGross') }}</span>
                  <span class="rescisao-page__value--gross">{{ formatBrl(result.totalGross) }}</span>
                </div>
                <div class="rescisao-page__breakdown-row rescisao-page__breakdown-row--deduction">
                  <span>{{ t('rescisao.results.inss') }}</span>
                  <span class="rescisao-page__value--negative">− {{ formatBrl(result.inss) }}</span>
                </div>
                <div v-if="result.irrf > 0" class="rescisao-page__breakdown-row rescisao-page__breakdown-row--deduction">
                  <span>{{ t('rescisao.results.irrf') }}</span>
                  <span class="rescisao-page__value--negative">− {{ formatBrl(result.irrf) }}</span>
                </div>
                <div class="rescisao-page__breakdown-row rescisao-page__breakdown-row--net">
                  <span>{{ t('rescisao.results.netTotal') }}</span>
                  <span class="rescisao-page__value--positive">{{ formatBrl(result.netTotal) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <ToolSaveResult
              intent="receivable"
              :label="t('rescisao.hero.title')"
              :amount="result.netTotal"
            />

            <!-- Action bar -->
            <UiSurfaceCard class="rescisao-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('rescisao.actions.saved') : t('rescisao.actions.save') }}
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
              <p class="rescisao-page__disclaimer">
                {{ t('rescisao.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="rescisao-page__disclaimer">
                {{ t('rescisao.disclaimer.avisoPrevioNote') }}
              </p>
              <p class="rescisao-page__disclaimer">
                {{ t('rescisao.disclaimer.notLegal') }}
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
.rescisao-root {
  display: contents;
}

.rescisao-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.rescisao-page--authenticated {
  padding: var(--space-6, 24px);
}

.rescisao-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .rescisao-page__layout {
    grid-template-columns: 1fr;
  }
}

.rescisao-page__form-col,
.rescisao-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.rescisao-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.rescisao-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.rescisao-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.rescisao-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.rescisao-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.rescisao-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rescisao-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.rescisao-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.rescisao-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .rescisao-page__hero {
    grid-template-columns: 1fr;
  }
}

.rescisao-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.rescisao-page__results-section {
  margin-top: var(--space-6, 24px);
}

.rescisao-page__results-main,
.rescisao-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.rescisao-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Breakdown ───────────────────────────────────────────────────────────────── */
.rescisao-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.rescisao-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.rescisao-page__breakdown-row--notice {
  color: var(--color-brand-600, #0284c7);
}

.rescisao-page__breakdown-row--vacation {
  color: var(--color-semantic-positive, #22c55e);
}

.rescisao-page__breakdown-row--fgts {
  color: var(--color-semantic-warning, #f59e0b);
}

.rescisao-page__breakdown-row--deduction {
  color: var(--color-text-secondary);
}

.rescisao-page__breakdown-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.rescisao-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.rescisao-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.rescisao-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

.rescisao-page__value--gross {
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

/* ── Disclaimer ──────────────────────────────────────────────────────────────── */
.rescisao-page__disclaimer {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1, 4px) 0;
  line-height: 1.5;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.rescisao-page__action-bar {
  flex-shrink: 0;
}
</style>
