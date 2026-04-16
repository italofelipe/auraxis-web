import { computed, reactive, ref, type ComputedRef } from "vue";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useToolPageContext } from "~/features/tools/composables/use-tool-page-context";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useCreateReceivableMutation } from "~/features/receivables/queries/use-create-receivable-mutation";
import {
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
  type ThirteenthSalaryResult,
} from "~/features/tools/model/thirteenth-salary";

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

/* eslint-disable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type inferred from composable shape */
/**
 * Orchestrates form state, calculation, simulation save, goal bridge and
 * budget bridge mutations for the Thirteenth Salary calculator page.
 *
 * @returns Reactive bindings, computed flags, mutation handlers and modal state.
 */
export function useThirteenthSalaryPage() {
  const { t, toast, getErrorMessage, router, isAuthenticated, hasPremiumAccess, formatBrl } =
    useToolPageContext();

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

  const saveSimulationMutation = useSaveSimulationMutation();
  const createGoalMutation = useCreateGoalMutation();
  const createReceivableMutation = useCreateReceivableMutation();

  const showGoalModal = ref(false);
  const goalForm = reactive({ name: "", targetDate: null as number | null });
  const showBudgetModal = ref(false);

  /** Validates the form and triggers the calculation when valid. */
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

  /** Resets the form to its initial state and clears the result. */
  function handleReset(): void {
    reset();
    result.value = null;
    savedSimulationId.value = null;
  }

  const summaryMetrics: ComputedRef<Array<{ label: string; value: string }>> = computed(() => {
    if (!result.value) { return []; }
    return [
      { label: t("thirteenthSalary.results.totalGross"), value: formatBrl(result.value.totalGross) },
      { label: t("thirteenthSalary.results.totalInss"), value: `\u2212 ${formatBrl(result.value.totalInss)}` },
      { label: t("thirteenthSalary.results.totalIrrf"), value: `\u2212 ${formatBrl(result.value.totalIrrf)}` },
    ];
  });

  /**
   * Saves the current simulation and returns its id, re-using a cached id when available.
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

  /** Saves the simulation when the user clicks the Save button. */
  async function handleSaveSimulation(): Promise<void> {
    await ensureSimulationSaved();
  }

  /** Opens the goal modal pre-filled with sensible defaults. */
  function openGoalModal(): void {
    goalForm.name = t("thirteenthSalary.goal.defaultName", { year: new Date().getFullYear() });
    goalForm.targetDate = isoToTs(isoDate(12, 20));
    showGoalModal.value = true;
  }

  /** Saves the simulation (if needed) then creates the goal. */
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

  /** Opens the budget confirmation modal. */
  function openBudgetModal(): void {
    showBudgetModal.value = true;
  }

  /** Saves the simulation (if needed) then creates the two receivable entries. */
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

  const isBridging = computed((): boolean =>
    saveSimulationMutation.isPending.value ||
    createGoalMutation.isPending.value ||
    createReceivableMutation.isPending.value,
  );

  return {
    t, toast, router, isAuthenticated, hasPremiumAccess, formatBrl,
    form, validationError, isDirty, patch,
    result, savedSimulationId,
    monthsOptions,
    saveSimulationMutation, createGoalMutation, createReceivableMutation,
    showGoalModal, goalForm, showBudgetModal,
    summaryMetrics,
    isBridging,
    handleCalculate,
    handleReset,
    handleSaveSimulation,
    openGoalModal,
    handleCreateGoal,
    openBudgetModal,
    handleAddToBudget,
  };
}
/* eslint-enable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
