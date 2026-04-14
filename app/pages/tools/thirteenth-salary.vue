<script setup lang="ts">
import { computed, reactive, ref } from "vue";
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
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useCreateReceivableMutation } from "~/features/receivables/queries/use-create-receivable-mutation";
import {
  BR_TAX_TABLE_YEAR,
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
  type ThirteenthSalaryResult,
} from "~/features/tools/model/thirteenth-salary";
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
  title: t("thirteenthSalary.seo.title"),
  description: t("thirteenthSalary.seo.description"),
  ogTitle: t("thirteenthSalary.seo.ogTitle"),
  ogDescription: t("thirteenthSalary.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

// ─── Session & access ─────────────────────────────────────────────────────────

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const premiumAccessQuery = useEntitlementQuery(
  "advanced_simulations",
);

/**
 * True when the authenticated user holds a premium subscription.
 */
const hasPremiumAccess = computed<boolean>(
  () => premiumAccessQuery.data.value === true,
);

// ─── Calculator form state ────────────────────────────────────────────────────

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<ThirteenthSalaryFormState>(createDefaultThirteenthSalaryFormState);

const result = ref<ThirteenthSalaryResult | null>(null);
const savedSimulationId = ref<string | null>(null);

const monthsOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: t(`thirteenthSalary.months.${i + 1}`),
    value: i + 1,
  })),
);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();
const createReceivableMutation = useCreateReceivableMutation();

// ─── Goal modal state ─────────────────────────────────────────────────────────

const showGoalModal = ref(false);

const goalForm = reactive({
  name: "",
  targetDate: null as number | null,
});

// ─── Budget (receitas) modal state ────────────────────────────────────────────

const showBudgetModal = ref(false);

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
 * Returns the ISO date string for the current year's target month and day.
 *
 * @param month 1-based month number.
 * @param day Day of month.
 * @returns ISO date string YYYY-MM-DD.
 */
function isoDate(month: number, day: number): string {
  const year = new Date().getFullYear();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Converts an ISO date string to a timestamp for NDatePicker.
 *
 * @param iso ISO date string YYYY-MM-DD.
 * @returns Unix timestamp in milliseconds.
 */
function isoToTs(iso: string): number {
  return new Date(iso).getTime();
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateThirteenthSalaryForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`thirteenthSalary.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateThirteenthSalary(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("thirteenthSalary.results.totalGross"),
      value: formatBrl(result.value.totalGross),
    },
    {
      label: t("thirteenthSalary.results.totalInss"),
      value: `− ${formatBrl(result.value.totalInss)}`,
    },
    {
      label: t("thirteenthSalary.results.totalIrrf"),
      value: `− ${formatBrl(result.value.totalIrrf)}`,
    },
  ];
});

// ─── Save simulation (free + premium) ────────────────────────────────────────

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
      name: t("thirteenthSalary.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "thirteenth_salary",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "thirteenth-salary/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 * Saves the simulation when the user clicks the standalone Save button.
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}

// ─── Goal bridge (premium) ───────────────────────────────────────────────────

/**
 * Opens the goal modal pre-filled with sensible defaults.
 */
function openGoalModal(): void {
  goalForm.name = t("thirteenthSalary.goal.defaultName", { year: new Date().getFullYear() });
  goalForm.targetDate = isoToTs(isoDate(12, 20));
  showGoalModal.value = true;
}

// ─── Budget bridge (premium) ─────────────────────────────────────────────────

/**
 * Opens the budget confirmation modal.
 */
function openBudgetModal(): void {
  showBudgetModal.value = true;
}

// ─── Derived action states ────────────────────────────────────────────────────

const isBridging = computed(
  () =>
    saveSimulationMutation.isPending.value ||
    createGoalMutation.isPending.value ||
    createReceivableMutation.isPending.value,
);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root.
       display:contents makes it invisible to the layout engine. -->
  <div class="thirteenth-salary-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="thirteenth-salary-page thirteenth-salary-page--authenticated">
      <div class="thirteenth-salary-page__layout">
        <!-- Form column -->
        <div class="thirteenth-salary-page__form-col">
          <UiPageHeader
            :title="t('thirteenthSalary.hero.title')"
            :subtitle="t('thirteenthSalary.hero.subtitle')"
          />

          <UiGlassPanel class="thirteenth-salary-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('thirteenthSalary.form.title')">
                <NFormItem :label="t('thirteenthSalary.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('thirteenthSalary.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('thirteenthSalary.form.monthsWorked')">
                  <NSelect
                    :value="form.monthsWorked"
                    :options="monthsOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthsWorked: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.variablePay') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.variablePayTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.variablePay"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ variablePay: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.advancePaid') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.advancePayTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.advancePaid"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ advancePaid: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.dependents') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.dependentsTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.dependents"
                    :min="0"
                    :max="10"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ dependents: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="thirteenth-salary-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('thirteenthSalary.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('thirteenthSalary.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="thirteenth-salary-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('thirteenthSalary.results.totalNet')"
              :value="formatBrl(result.totalNet)"
              :reason="t('thirteenthSalary.results.totalNetNote')"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Installment breakdown -->
            <UiSurfaceCard>
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">{{ t('thirteenthSalary.results.firstInstallment') }}</span>
                  <NTag size="small" round>{{ t('thirteenthSalary.results.firstInstallmentDate') }}</NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.firstInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.firstInstallment.net) }}</span>
                  </div>
                </div>
                <p class="thirteenth-salary-page__installment-note">{{ t('thirteenthSalary.results.firstInstallmentNote') }}</p>
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">{{ t('thirteenthSalary.results.secondInstallment') }}</span>
                  <NTag size="small" round>{{ t('thirteenthSalary.results.secondInstallmentDate') }}</NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.secondInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionInss') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.inss) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionIrrf') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.irrf) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.secondInstallment.net) }}</span>
                  </div>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Action bar (free + premium) -->
            <UiSurfaceCard class="thirteenth-salary-page__action-bar">
              <NSpace vertical :size="8">
                <!-- Save simulation — available to all authenticated users -->
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || isBridging"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('thirteenthSalary.actions.saved') : t('thirteenthSalary.actions.save') }}
                </NButton>

                <!-- Premium bridge actions -->
                <template v-if="hasPremiumAccess">
                  <NButton
                    block
                    type="primary"
                    :disabled="isBridging"
                    @click="openGoalModal"
                  >
                    {{ t('thirteenthSalary.actions.addToGoal') }}
                  </NButton>
                  <NButton
                    block
                    type="primary"
                    :disabled="isBridging"
                    @click="openBudgetModal"
                  >
                    {{ t('thirteenthSalary.actions.addToBudget') }}
                  </NButton>
                </template>

                <!-- Upsell when not premium -->
                <NThing
                  v-else
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

            <UiSurfaceCard>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.notFinancialAdvice') }}
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
.thirteenth-salary-root {
  display: contents;
}

.thirteenth-salary-page {
  min-height: 100vh;
  background: var(--color-bg-base);
  display: flex;
  flex-direction: column;
}

.thirteenth-salary-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

.thirteenth-salary-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.thirteenth-salary-page__brand-mark {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.thirteenth-salary-page__brand-copy {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.thirteenth-salary-page__header-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.thirteenth-salary-page__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.thirteenth-salary-page__hero {
  display: grid;
  gap: var(--space-4);
  align-items: start;
}

.thirteenth-salary-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.thirteenth-salary-page__form-panel {
  padding: var(--space-4);
}

.thirteenth-salary-page__form-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.thirteenth-salary-page__layout {
  display: flex;
  gap: var(--space-4);
  align-items: start;
}

.thirteenth-salary-page--authenticated .thirteenth-salary-page__layout {
  padding: var(--space-4);
}

.thirteenth-salary-page__form-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-col {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-section {
  width: 100%;
}

.thirteenth-salary-page__results-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-aside {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__installment {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.thirteenth-salary-page__installment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.thirteenth-salary-page__installment-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.thirteenth-salary-page__installment-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.thirteenth-salary-page__installment-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.thirteenth-salary-page__installment-row--net {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--space-1);
}

.thirteenth-salary-page__installment-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.thirteenth-salary-page__installment-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.thirteenth-salary-page__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.thirteenth-salary-page__value--negative {
  color: var(--color-error);
}

.thirteenth-salary-page__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1);
}

.thirteenth-salary-page__action-bar {
  display: flex;
  flex-direction: column;
}

.thirteenth-salary-page__modal-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
}

.thirteenth-salary-page__modal-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 900px) {
  .thirteenth-salary-page__layout {
    flex-direction: column;
  }

  .thirteenth-salary-page__results-col,
  .thirteenth-salary-page__results-aside {
    width: 100%;
  }

  .thirteenth-salary-page__hero {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 901px) {
  .thirteenth-salary-page__hero {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
