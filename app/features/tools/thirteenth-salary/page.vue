<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NThing,
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useToolPageContext } from "~/features/tools/composables/use-tool-page-context";
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

import ThirteenthSalaryResultPanel from "./ThirteenthSalaryResult.vue";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

defineOptions({ name: "ThirteenthSalaryPage" });

const { t, toast, getErrorMessage, router, isAuthenticated, hasPremiumAccess, formatBrl } =
  useToolPageContext();

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

// ─── Modal state ──────────────────────────────────────────────────────────────

const showGoalModal = ref(false);
const goalForm = reactive({ name: "", targetDate: null as number | null });
const showBudgetModal = ref(false);

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
 *
 * @returns void
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
 *
 * @returns void
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("thirteenthSalary.results.totalGross"), value: formatBrl(result.value.totalGross) },
    { label: t("thirteenthSalary.results.totalInss"), value: `\u2212 ${formatBrl(result.value.totalInss)}` },
    { label: t("thirteenthSalary.results.totalIrrf"), value: `\u2212 ${formatBrl(result.value.totalIrrf)}` },
  ];
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
 * Saves the simulation when the user clicks the Save button.
 *
 * @returns void
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}

// ─── Goal bridge ──────────────────────────────────────────────────────────────

/**
 * Opens the goal modal pre-filled with sensible defaults.
 *
 * @returns void
 */
function openGoalModal(): void {
  goalForm.name = t("thirteenthSalary.goal.defaultName", { year: new Date().getFullYear() });
  goalForm.targetDate = isoToTs(isoDate(12, 20));
  showGoalModal.value = true;
}

/**
 * Saves the simulation (if needed) then creates the goal.
 *
 * @returns void
 */
async function handleCreateGoal(): Promise<void> {
  if (!result.value) { return; }
  await ensureSimulationSaved();
  const targetDate = goalForm.targetDate
    ? new Date(goalForm.targetDate).toISOString().split("T")[0]
    : undefined;
  try {
    await createGoalMutation.mutateAsync({
      name: goalForm.name,
      target_amount: result.value.totalNet,
      target_date: targetDate ?? null,
    });
    showGoalModal.value = false;
  } catch (err) {
    captureException(err, { context: "thirteenth-salary/create-goal" });
    toast.error(getErrorMessage(err));
  }
}

// ─── Budget bridge ────────────────────────────────────────────────────────────

/**
 * Opens the budget confirmation modal.
 *
 * @returns void
 */
function openBudgetModal(): void {
  showBudgetModal.value = true;
}

/**
 * Saves the simulation (if needed) then creates the two receivable entries.
 *
 * @returns void
 */
async function handleAddToBudget(): Promise<void> {
  if (!result.value) { return; }
  await ensureSimulationSaved();
  const res = result.value;
  try {
    await Promise.all([
      createReceivableMutation.mutateAsync({
        description: t("thirteenthSalary.budget.firstInstallmentLabel"),
        amount: res.firstInstallment.net,
        expected_date: isoDate(11, 30),
        category: "salary",
      }),
      createReceivableMutation.mutateAsync({
        description: t("thirteenthSalary.budget.secondInstallmentLabel"),
        amount: res.secondInstallment.net,
        expected_date: isoDate(12, 20),
        category: "salary",
      }),
    ]);
    showBudgetModal.value = false;
  } catch (err) {
    captureException(err, { context: "thirteenth-salary/add-to-budget" });
    toast.error(getErrorMessage(err));
  }
}

const isBridging = computed(
  () =>
    saveSimulationMutation.isPending.value ||
    createGoalMutation.isPending.value ||
    createReceivableMutation.isPending.value,
);
</script>

<template>
  <div class="thirteenth-salary-root">
  <!-- ═══ AUTHENTICATED ═══════════════════════════════════════════════════════ -->
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
            <UiSurfaceCard>
              <ThirteenthSalaryResultPanel :result="result" />
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="thirteenth-salary-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || isBridging"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('thirteenthSalary.actions.saved') : t('thirteenthSalary.actions.save') }}
                </NButton>

                <template v-if="hasPremiumAccess">
                  <NButton block type="primary" :disabled="isBridging" @click="openGoalModal">
                    {{ t('thirteenthSalary.actions.addToGoal') }}
                  </NButton>
                  <NButton block type="primary" :disabled="isBridging" @click="openBudgetModal">
                    {{ t('thirteenthSalary.actions.addToBudget') }}
                  </NButton>
                </template>

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
      <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>

    <!-- ═══ GOAL MODAL ══════════════════════════════════════════════════════════ -->
  <NModal
    v-model:show="showGoalModal"
    preset="card"
    :title="t('thirteenthSalary.goalModal.title')"
    style="max-width: 480px"
    :mask-closable="!isBridging"
    :closable="!isBridging"
  >
    <NSpace vertical :size="16">
      <NFormItem :label="t('thirteenthSalary.goalModal.nameLabel')">
        <NInput
          v-model:value="goalForm.name"
          :placeholder="t('thirteenthSalary.goalModal.namePlaceholder')"
        />
      </NFormItem>

      <NFormItem :label="t('thirteenthSalary.goalModal.targetDateLabel')">
        <NDatePicker
          v-model:value="goalForm.targetDate"
          type="date"
          style="width: 100%"
        />
      </NFormItem>

      <div v-if="result" class="thirteenth-salary-page__modal-summary">
        <span>{{ t('thirteenthSalary.goalModal.targetAmountLabel') }}</span>
        <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.totalNet) }}</span>
      </div>
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="isBridging" @click="showGoalModal = false">
          {{ t('thirteenthSalary.goalModal.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="createGoalMutation.isPending.value || saveSimulationMutation.isPending.value"
          :disabled="!goalForm.name"
          @click="handleCreateGoal"
        >
          {{ t('thirteenthSalary.goalModal.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <!-- ═══ BUDGET MODAL ════════════════════════════════════════════════════════ -->
  <NModal
    v-model:show="showBudgetModal"
    preset="card"
    :title="t('thirteenthSalary.budgetModal.title')"
    style="max-width: 480px"
    :mask-closable="!isBridging"
    :closable="!isBridging"
  >
    <NSpace v-if="result" vertical :size="12">
      <p class="thirteenth-salary-page__modal-description">
        {{ t('thirteenthSalary.budgetModal.description') }}
      </p>

      <div class="thirteenth-salary-page__installment-rows">
        <div class="thirteenth-salary-page__installment-row">
          <span>{{ t('thirteenthSalary.budget.firstInstallmentLabel') }}</span>
          <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.firstInstallment.net) }}</span>
        </div>
        <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
          <span class="thirteenth-salary-page__installment-date">{{ t('thirteenthSalary.results.firstInstallmentDate') }}</span>
        </div>
        <div class="thirteenth-salary-page__installment-row" style="margin-top:8px">
          <span>{{ t('thirteenthSalary.budget.secondInstallmentLabel') }}</span>
          <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.secondInstallment.net) }}</span>
        </div>
        <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
          <span class="thirteenth-salary-page__installment-date">{{ t('thirteenthSalary.results.secondInstallmentDate') }}</span>
        </div>
      </div>
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="isBridging" @click="showBudgetModal = false">
          {{ t('thirteenthSalary.budgetModal.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="createReceivableMutation.isPending.value || saveSimulationMutation.isPending.value"
          @click="handleAddToBudget"
        >
          {{ t('thirteenthSalary.budgetModal.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
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

.thirteenth-salary-page__installment-row--deduction {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.thirteenth-salary-page__installment-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.thirteenth-salary-page__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
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
