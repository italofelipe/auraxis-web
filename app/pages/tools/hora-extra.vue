<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NTag,
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
  CLT_DEFAULT_HOURS_PER_MONTH,
  calculateHoraExtra,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
  type HoraExtraResult,
} from "~/features/tools/model/hora-extra";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
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
  title: t("horaExtra.seo.title"),
  description: t("horaExtra.seo.description"),
  ogTitle: t("horaExtra.seo.ogTitle"),
  ogDescription: t("horaExtra.seo.ogDescription"),
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
  useCalculatorFormState<HoraExtraFormState>(createDefaultHoraExtraFormState);

const result = ref<HoraExtraResult | null>(null);
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

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateHoraExtraForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`horaExtra.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateHoraExtra(form.value);
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
      label: t("horaExtra.results.totalOvertimeGross"),
      value: formatBrl(result.value.totalOvertimeGross),
    },
    {
      label: t("horaExtra.results.inssOvertimeImpact"),
      value: result.value.inssOvertimeImpact > 0
        ? `− ${formatBrl(result.value.inssOvertimeImpact)}`
        : formatBrl(0),
    },
    {
      label: t("horaExtra.results.hourlyRate"),
      value: formatBrl(result.value.hourlyRate),
    },
    {
      label: t("horaExtra.results.totalOvertimeHours"),
      value: `${result.value.totalOvertimeHours}h`,
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
      name: t("horaExtra.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "hora_extra",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "hora-extra/save-simulation" });
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
  <div class="hora-extra-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="hora-extra-page hora-extra-page--authenticated">
      <div class="hora-extra-page__layout">
        <!-- Form column -->
        <div class="hora-extra-page__form-col">
          <UiPageHeader
            :title="t('horaExtra.hero.title')"
            :subtitle="t('horaExtra.hero.subtitle')"
          />

          <UiGlassPanel class="hora-extra-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('horaExtra.form.title')">
                <NFormItem :label="t('horaExtra.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('horaExtra.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hoursPerMonth') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hoursPerMonthTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hoursPerMonth"
                    :min="1"
                    :max="744"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ hoursPerMonth: v ?? CLT_DEFAULT_HOURS_PER_MONTH })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours50') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours50Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours50"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours50: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours75') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours75Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours75"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours75: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours100') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours100Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours100"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours100: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="hora-extra-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('horaExtra.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('horaExtra.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="hora-extra-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('horaExtra.results.netOvertimeEstimate')"
              :value="formatBrl(result.netOvertimeEstimate)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Per-rate breakdown -->
            <UiSurfaceCard>
              <div class="hora-extra-page__breakdown">
                <div
                  v-if="result.overtime50.hours > 0"
                  class="hora-extra-page__breakdown-row"
                >
                  <div class="hora-extra-page__breakdown-label">
                    <NTag size="small" type="info">50%</NTag>
                    <span>{{ result.overtime50.hours }}h × {{ formatBrl(result.hourlyRate) }} × 1,5</span>
                  </div>
                  <span class="hora-extra-page__breakdown-value">
                    {{ formatBrl(result.overtime50.grossAmount) }}
                  </span>
                </div>

                <div
                  v-if="result.overtime75.hours > 0"
                  class="hora-extra-page__breakdown-row"
                >
                  <div class="hora-extra-page__breakdown-label">
                    <NTag size="small" type="warning">75%</NTag>
                    <span>{{ result.overtime75.hours }}h × {{ formatBrl(result.hourlyRate) }} × 1,75</span>
                  </div>
                  <span class="hora-extra-page__breakdown-value">
                    {{ formatBrl(result.overtime75.grossAmount) }}
                  </span>
                </div>

                <div
                  v-if="result.overtime100.hours > 0"
                  class="hora-extra-page__breakdown-row"
                >
                  <div class="hora-extra-page__breakdown-label">
                    <NTag size="small" type="error">100%</NTag>
                    <span>{{ result.overtime100.hours }}h × {{ formatBrl(result.hourlyRate) }} × 2,0</span>
                  </div>
                  <span class="hora-extra-page__breakdown-value">
                    {{ formatBrl(result.overtime100.grossAmount) }}
                  </span>
                </div>

                <div class="hora-extra-page__breakdown-row hora-extra-page__breakdown-row--total">
                  <span>{{ t('horaExtra.results.totalOvertimeGross') }}</span>
                  <span class="hora-extra-page__value--gross">{{ formatBrl(result.totalOvertimeGross) }}</span>
                </div>

                <div class="hora-extra-page__breakdown-row hora-extra-page__breakdown-row--deduction">
                  <span>{{ t('horaExtra.results.inssOvertimeImpact') }}</span>
                  <span class="hora-extra-page__value--negative">
                    − {{ formatBrl(result.inssOvertimeImpact) }}
                  </span>
                </div>

                <div class="hora-extra-page__breakdown-row hora-extra-page__breakdown-row--net">
                  <span>{{ t('horaExtra.results.netOvertimeEstimate') }}</span>
                  <span class="hora-extra-page__value--positive">{{ formatBrl(result.netOvertimeEstimate) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="hora-extra-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('horaExtra.actions.saved') : t('horaExtra.actions.save') }}
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
              <p class="hora-extra-page__disclaimer">
                {{ t('horaExtra.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="hora-extra-page__disclaimer">
                {{ t('horaExtra.disclaimer.irNotIncluded') }}
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
.hora-extra-root {
  display: contents;
}

.hora-extra-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.hora-extra-page--authenticated {
  padding: var(--space-6, 24px);
}

.hora-extra-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hora-extra-page__layout {
    grid-template-columns: 1fr;
  }
}

.hora-extra-page__form-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.hora-extra-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.hora-extra-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.hora-extra-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.hora-extra-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.hora-extra-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hora-extra-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.hora-extra-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.hora-extra-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .hora-extra-page__hero {
    grid-template-columns: 1fr;
  }
}

.hora-extra-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.hora-extra-page__results-section {
  margin-top: var(--space-6, 24px);
}

.hora-extra-page__results-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.hora-extra-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Breakdown ───────────────────────────────────────────────────────────────── */
.hora-extra-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.hora-extra-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}

.hora-extra-page__breakdown-label {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  color: var(--color-text-secondary);
}

.hora-extra-page__breakdown-value {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.hora-extra-page__breakdown-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.hora-extra-page__breakdown-row--deduction {
  color: var(--color-text-secondary);
}

.hora-extra-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.hora-extra-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.hora-extra-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

.hora-extra-page__value--gross {
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

/* ── Disclaimer ──────────────────────────────────────────────────────────────── */
.hora-extra-page__disclaimer {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1, 4px) 0;
  line-height: 1.5;
}

/* ── Action bar ──────────────────────────────────────────────────────────────── */
.hora-extra-page__action-bar {
  flex-shrink: 0;
}
</style>
