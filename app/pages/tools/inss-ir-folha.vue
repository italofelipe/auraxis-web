<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NTag,
  NThing,
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import {
  BR_TAX_TABLE_YEAR,
  calculateInssIr,
  createDefaultInssIrFormState,
  validateInssIrForm,
  type InssIrFormState,
  type InssIrResult,
} from "~/features/tools/model/inss-ir-folha";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import TaxBracketTable, {
  type TaxBracketRow,
} from "~/components/tool/TaxBracketTable/TaxBracketTable.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("inssIrFolha.seo.title"),
  description: t("inssIrFolha.seo.description"),
  ogTitle: t("inssIrFolha.seo.ogTitle"),
  ogDescription: t("inssIrFolha.seo.ogDescription"),
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
  useCalculatorFormState<InssIrFormState>(createDefaultInssIrFormState);

const result = ref<InssIrResult | null>(null);
const savedSimulationId = ref<string | null>(null);

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

/**
 * Formats a rate (0–1 fraction) as a percentage string with one decimal.
 *
 * @param rate Fractional rate (e.g. 0.075).
 * @returns Formatted percentage string (e.g. "7,5%").
 */
function formatRate(rate: number): string {
  return n(rate, "percent");
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateInssIrForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`inssIrFolha.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateInssIr(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("inssIrFolha.results.grossSalary"),
      value: formatBrl(result.value.grossSalary),
    },
    {
      label: t("inssIrFolha.results.totalInss"),
      value: `− ${formatBrl(result.value.totalInss)}`,
    },
    {
      label: t("inssIrFolha.results.totalIrrf"),
      value: `− ${formatBrl(result.value.totalIrrf)}`,
    },
    {
      label: t("inssIrFolha.results.effectiveRate"),
      value: `${result.value.effectiveRate.toFixed(1)}%`,
    },
  ];
});

// ─── INSS bracket rows ────────────────────────────────────────────────────────

/**
 * Maps InssBracketBreakdown[] to TaxBracketRow[] for TaxBracketTable.
 */
const inssBracketRows = computed<TaxBracketRow[]>(() => {
  if (!result.value) { return []; }
  return result.value.inssBrackets.map((b, i) => {
    const rangeLabel = b.from === 0
      ? t("inssIrFolha.table.upTo", { value: formatBrl(b.to) })
      : `${formatBrl(b.from)} — ${formatBrl(b.to)}`;
    return {
      key: `inss-${i}`,
      rangeLabel,
      rateLabel: formatRate(b.rate),
      baseLabel: b.isActive ? formatBrl(b.sliceAmount) : "—",
      taxLabel: b.isActive ? formatBrl(b.contribution) : "—",
      isActive: b.isActive,
    };
  });
});

// ─── IRRF bracket rows ────────────────────────────────────────────────────────

/**
 * Maps IrrfBracketBreakdown[] to TaxBracketRow[] for TaxBracketTable.
 */
const irrfBracketRows = computed<TaxBracketRow[]>(() => {
  if (!result.value) { return []; }
  return result.value.irrfBrackets.map((b, i) => {
    let rangeLabel: string;
    if (b.from === 0 && b.to !== null) {
      rangeLabel = `${t("inssIrFolha.table.exempt")} — ${t("inssIrFolha.table.upTo", { value: formatBrl(b.to) })}`;
    } else if (b.to === null) {
      rangeLabel = t("inssIrFolha.table.above", { value: formatBrl(b.from) });
    } else {
      rangeLabel = `${formatBrl(b.from)} — ${formatBrl(b.to)}`;
    }
    const rateLabel = b.rate === 0
      ? t("inssIrFolha.table.exempt")
      : formatRate(b.rate);
    return {
      key: `irrf-${i}`,
      rangeLabel,
      rateLabel,
      baseLabel: formatBrl(b.parcela),
      taxLabel: "—",
      isActive: b.isApplicable,
      badge: b.isApplicable ? t("inssIrFolha.table.irrfApplicable") : undefined,
    };
  });
});

// ─── Private pension cap note ─────────────────────────────────────────────────

/**
 * True when the private pension input was capped at 12% of gross salary.
 */
const privatePensionWasCapped = computed<boolean>(() => {
  if (!result.value || !form.value.grossSalary) { return false; }
  return result.value.privatePensionDeduction < form.value.privatePension;
});

// ─── Save simulation ──────────────────────────────────────────────────────────

/**
 * Saves the current simulation and returns its id.
 * Re-uses an existing id if the simulation was already saved.
 *
 * @returns Simulation id or null on failure.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }

  try {
    const simulation = await saveSimulationMutation.mutateAsync({
      name: t("inssIrFolha.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "inss_ir_folha",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "inss-ir-folha/save-simulation" });
    return null;
  }
}

/**
 * Saves the simulation when the user clicks the standalone Save button.
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root.
       display:contents makes it invisible to the layout engine. -->
  <div class="inss-ir-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="inss-ir-page inss-ir-page--authenticated">
      <div class="inss-ir-page__layout">
        <!-- Form column -->
        <div class="inss-ir-page__form-col">
          <UiPageHeader
            :title="t('inssIrFolha.hero.title')"
            :subtitle="t('inssIrFolha.hero.subtitle')"
          />

          <UiGlassPanel class="inss-ir-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('inssIrFolha.form.title')">
                <NFormItem :label="t('inssIrFolha.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('inssIrFolha.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('inssIrFolha.form.dependents') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('inssIrFolha.form.dependentsTooltip') }}
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

                <NFormItem>
                  <template #label>
                    {{ t('inssIrFolha.form.alimentPension') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('inssIrFolha.form.alimentPensionTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.alimentPension"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ alimentPension: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('inssIrFolha.form.privatePension') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('inssIrFolha.form.privatePensionTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.privatePension"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ privatePension: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="inss-ir-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('inssIrFolha.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('inssIrFolha.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="inss-ir-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('inssIrFolha.results.netSalary')"
              :value="formatBrl(result.netSalary)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Detailed breakdown accordion -->
            <UiSurfaceCard>
              <NCollapse>
                <!-- INSS bracket breakdown -->
                <NCollapseItem
                  :title="t('inssIrFolha.results.inssBreakdown')"
                  name="inss"
                >
                  <TaxBracketTable
                    :rows="inssBracketRows"
                    :range-header="t('inssIrFolha.table.bracketRange')"
                    :rate-header="t('inssIrFolha.table.rate')"
                    :base-header="t('inssIrFolha.table.sliceAmount')"
                    :tax-header="t('inssIrFolha.table.contribution')"
                    :total-label="t('inssIrFolha.table.total')"
                    :total-value="formatBrl(result.totalInss)"
                  />
                </NCollapseItem>

                <!-- IR deductions -->
                <NCollapseItem
                  :title="t('inssIrFolha.results.irDeductions')"
                  name="deductions"
                >
                  <div class="inss-ir-page__deductions">
                    <div class="inss-ir-page__deduction-row">
                      <span>{{ t('inssIrFolha.deductions.inss') }}</span>
                      <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.totalInss) }}</span>
                    </div>
                    <div v-if="result.dependentsDeduction > 0" class="inss-ir-page__deduction-row">
                      <span>{{ t('inssIrFolha.deductions.dependents', { count: form.dependents }) }}</span>
                      <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.dependentsDeduction) }}</span>
                    </div>
                    <div v-if="result.alimentPensionDeduction > 0" class="inss-ir-page__deduction-row">
                      <span>{{ t('inssIrFolha.deductions.alimentPension') }}</span>
                      <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.alimentPensionDeduction) }}</span>
                    </div>
                    <div v-if="result.privatePensionDeduction > 0" class="inss-ir-page__deduction-row">
                      <span>{{ t('inssIrFolha.deductions.privatePension') }}</span>
                      <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.privatePensionDeduction) }}</span>
                    </div>
                    <div class="inss-ir-page__deduction-row inss-ir-page__deduction-row--total">
                      <span>{{ t('inssIrFolha.results.irBase') }}</span>
                      <span class="inss-ir-page__deduction-base">{{ formatBrl(result.irBase) }}</span>
                    </div>
                    <p v-if="privatePensionWasCapped" class="inss-ir-page__cap-note">
                      {{ t('inssIrFolha.disclaimer.privatePensionCapped') }}
                    </p>
                  </div>
                </NCollapseItem>

                <!-- IRRF bracket breakdown -->
                <NCollapseItem
                  :title="t('inssIrFolha.results.irrfBreakdown')"
                  name="irrf"
                >
                  <TaxBracketTable
                    :rows="irrfBracketRows"
                    :range-header="t('inssIrFolha.table.irrfBracketRange')"
                    :rate-header="t('inssIrFolha.table.rate')"
                    :base-header="t('inssIrFolha.table.irrfParcela')"
                    tax-header=""
                    :total-label="t('inssIrFolha.table.total')"
                    :total-value="formatBrl(result.totalIrrf)"
                  />
                </NCollapseItem>
              </NCollapse>
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="inss-ir-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('inssIrFolha.actions.saved') : t('inssIrFolha.actions.save') }}
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
              <p class="inss-ir-page__disclaimer">
                {{ t('inssIrFolha.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="inss-ir-page">
    <header class="inss-ir-page__header">
      <div class="inss-ir-page__brand">
        <span class="inss-ir-page__brand-mark">Auraxis</span>
        <span class="inss-ir-page__brand-copy">{{ t('inssIrFolha.header.publicTool') }}</span>
      </div>
      <div class="inss-ir-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">{{ t('inssIrFolha.header.otherTools') }}</NButton>
        <NButton type="primary" @click="router.push('/register')">{{ t('inssIrFolha.header.createAccount') }}</NButton>
      </div>
    </header>

    <main class="inss-ir-page__content">
      <section class="inss-ir-page__hero">
        <div class="inss-ir-page__hero-copy">
          <NTag round type="warning">{{ t('inssIrFolha.hero.badge') }}</NTag>
          <UiPageHeader
            :title="t('inssIrFolha.hero.title')"
            :subtitle="t('inssIrFolha.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="inss-ir-page__form-panel">
          <NForm @submit.prevent="handleCalculate">
            <CalculatorFormSection :title="t('inssIrFolha.form.title')">
              <NFormItem :label="t('inssIrFolha.form.grossSalary')">
                <NInputNumber
                  :value="form.grossSalary"
                  :placeholder="t('inssIrFolha.form.grossSalaryPlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ grossSalary: v })"
                />
              </NFormItem>

              <NFormItem>
                <template #label>
                  {{ t('inssIrFolha.form.dependents') }}
                  <NTooltip>
                    <template #trigger>
                      <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                    </template>
                    {{ t('inssIrFolha.form.dependentsTooltip') }}
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

              <NFormItem>
                <template #label>
                  {{ t('inssIrFolha.form.alimentPension') }}
                  <NTooltip>
                    <template #trigger>
                      <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                    </template>
                    {{ t('inssIrFolha.form.alimentPensionTooltip') }}
                  </NTooltip>
                </template>
                <NInputNumber
                  :value="form.alimentPension"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ alimentPension: v ?? 0 })"
                />
              </NFormItem>

              <NFormItem>
                <template #label>
                  {{ t('inssIrFolha.form.privatePension') }}
                  <NTooltip>
                    <template #trigger>
                      <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                    </template>
                    {{ t('inssIrFolha.form.privatePensionTooltip') }}
                  </NTooltip>
                </template>
                <NInputNumber
                  :value="form.privatePension"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ privatePension: v ?? 0 })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top:12px">
              {{ validationError }}
            </NAlert>

            <div class="inss-ir-page__form-actions">
              <NButton v-if="isDirty" quaternary @click="handleReset">
                {{ t('inssIrFolha.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('inssIrFolha.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="inss-ir-page__results-section">
        <div class="inss-ir-page__layout">
          <div class="inss-ir-page__results-main">
            <!-- INSS bracket table -->
            <UiSurfaceCard>
              <p class="inss-ir-page__section-title">{{ t('inssIrFolha.results.inssBreakdown') }}</p>
              <TaxBracketTable
                :rows="inssBracketRows"
                :range-header="t('inssIrFolha.table.bracketRange')"
                :rate-header="t('inssIrFolha.table.rate')"
                :base-header="t('inssIrFolha.table.sliceAmount')"
                :tax-header="t('inssIrFolha.table.contribution')"
                :total-label="t('inssIrFolha.table.total')"
                :total-value="formatBrl(result.totalInss)"
              />
            </UiSurfaceCard>

            <!-- IR deductions -->
            <UiSurfaceCard>
              <p class="inss-ir-page__section-title">{{ t('inssIrFolha.results.irDeductions') }}</p>
              <div class="inss-ir-page__deductions">
                <div class="inss-ir-page__deduction-row">
                  <span>{{ t('inssIrFolha.deductions.inss') }}</span>
                  <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.totalInss) }}</span>
                </div>
                <div v-if="result.dependentsDeduction > 0" class="inss-ir-page__deduction-row">
                  <span>{{ t('inssIrFolha.deductions.dependents', { count: form.dependents }) }}</span>
                  <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.dependentsDeduction) }}</span>
                </div>
                <div v-if="result.alimentPensionDeduction > 0" class="inss-ir-page__deduction-row">
                  <span>{{ t('inssIrFolha.deductions.alimentPension') }}</span>
                  <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.alimentPensionDeduction) }}</span>
                </div>
                <div v-if="result.privatePensionDeduction > 0" class="inss-ir-page__deduction-row">
                  <span>{{ t('inssIrFolha.deductions.privatePension') }}</span>
                  <span class="inss-ir-page__deduction-value">− {{ formatBrl(result.privatePensionDeduction) }}</span>
                </div>
                <div class="inss-ir-page__deduction-row inss-ir-page__deduction-row--total">
                  <span>{{ t('inssIrFolha.results.irBase') }}</span>
                  <span class="inss-ir-page__deduction-base">{{ formatBrl(result.irBase) }}</span>
                </div>
                <p v-if="privatePensionWasCapped" class="inss-ir-page__cap-note">
                  {{ t('inssIrFolha.disclaimer.privatePensionCapped') }}
                </p>
              </div>
            </UiSurfaceCard>

            <!-- IRRF bracket table -->
            <UiSurfaceCard>
              <p class="inss-ir-page__section-title">{{ t('inssIrFolha.results.irrfBreakdown') }}</p>
              <TaxBracketTable
                :rows="irrfBracketRows"
                :range-header="t('inssIrFolha.table.irrfBracketRange')"
                :rate-header="t('inssIrFolha.table.rate')"
                :base-header="t('inssIrFolha.table.irrfParcela')"
                tax-header=""
                :total-label="t('inssIrFolha.table.total')"
                :total-value="formatBrl(result.totalIrrf)"
              />
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <p class="inss-ir-page__disclaimer">
                {{ t('inssIrFolha.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
            </UiSurfaceCard>
          </div>

          <div class="inss-ir-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t('inssIrFolha.results.netSalary')"
                :value="formatBrl(result.netSalary)"
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
/* ── Root & page ─────────────────────────────────────────────────────────────── */
.inss-ir-root {
  display: contents;
}

.inss-ir-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.inss-ir-page--authenticated {
  padding: var(--space-6, 24px);
}

.inss-ir-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .inss-ir-page__layout {
    grid-template-columns: 1fr;
  }
}

.inss-ir-page__form-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.inss-ir-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.inss-ir-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.inss-ir-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.inss-ir-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.inss-ir-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.inss-ir-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.inss-ir-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.inss-ir-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.inss-ir-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.inss-ir-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .inss-ir-page__hero {
    grid-template-columns: 1fr;
  }
}

.inss-ir-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.inss-ir-page__results-section {
  margin-top: var(--space-6, 24px);
}

.inss-ir-page__results-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.inss-ir-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.inss-ir-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Deductions list ─────────────────────────────────────────────────────────── */
.inss-ir-page__deductions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.inss-ir-page__deduction-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.inss-ir-page__deduction-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.inss-ir-page__deduction-value {
  color: var(--color-semantic-negative, #ef4444);
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

.inss-ir-page__deduction-base {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

.inss-ir-page__cap-note {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

/* ── Disclaimer ──────────────────────────────────────────────────────────────── */
.inss-ir-page__disclaimer {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.inss-ir-page__action-bar {
  flex-shrink: 0;
}
</style>
