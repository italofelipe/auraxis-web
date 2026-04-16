import { computed, onMounted, reactive, ref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { useMessage } from "naive-ui";

import { captureException } from "~/core/observability";
import { STALE_TIME } from "~/core/query/stale-time";
import { useApiError } from "~/composables/useApiError";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";
import { useEntitlementClient } from "~/features/paywall/services/entitlement.client";
import { useCreateGoalFromInstallmentVsCashMutation } from "~/features/tools/queries/use-create-goal-from-installment-vs-cash-mutation";
import { useCreatePlannedExpenseFromInstallmentVsCashMutation } from "~/features/tools/queries/use-create-planned-expense-from-installment-vs-cash-mutation";
import { useInstallmentVsCashCalculateMutation } from "~/features/tools/queries/use-installment-vs-cash-calculate-mutation";
import { useSaveInstallmentVsCashMutation } from "~/features/tools/queries/use-save-installment-vs-cash-mutation";
import {
  createDefaultInstallmentVsCashFormState,
  INSTALLMENT_VS_CASH_PUBLIC_PATH,
  INSTALLMENT_VS_CASH_TOOL_ID,
  isInstallmentVsCashCalculation,
  isInstallmentVsCashPendingPayload,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashForm,
  type CreateInstallmentVsCashGoalPayload,
  type CreateInstallmentVsCashPlannedExpensePayload,
  type InstallmentVsCashCalculation,
  type InstallmentVsCashFormState,
  type InstallmentVsCashSavedSimulation,
  type SelectedPaymentOption,
} from "~/features/tools/model/installment-vs-cash";

/**
 * Builds a YYYY-MM-DD string from a date-picker timestamp.
 *
 * @param value Epoch milliseconds from Naive UI.
 * @returns ISO calendar string or undefined.
 */
function toIsoDate(value: number | null): string | undefined {
  if (value === null) { return undefined; }
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* eslint-disable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type inferred from composable shape */
/**
 * Orchestrates state, queries, mutations, and handlers for the
 * Installment vs Cash calculator page.
 *
 * @returns Reactive bindings, computed flags, mutation handlers and modal state.
 */
export function useInstallmentVsCashPage() {
  const { t } = useI18n();
  const message = useMessage();
  const { getErrorMessage } = useApiError();
  const router = useRouter();
  const sessionStore = useSessionStore();
  const toolContextStore = useToolContextStore();
  const { saveRedirect } = useAuthRedirectContext();
  const entitlementClient = useEntitlementClient();

  const form = ref<InstallmentVsCashFormState>(createDefaultInstallmentVsCashFormState());
  const calculation = ref<InstallmentVsCashCalculation | null>(null);
  const savedSimulation = ref<InstallmentVsCashSavedSimulation | null>(null);
  const validationMessage = ref<string | null>(null);
  const showGoalModal = ref(false);
  const showExpenseModal = ref(false);

  const goalForm = reactive<{
    title: string;
    selectedOption: SelectedPaymentOption;
    description: string;
    targetDate: number | null;
  }>({ title: "", selectedOption: "cash", description: "", targetDate: null });

  const plannedExpenseForm = reactive<{
    title: string;
    selectedOption: SelectedPaymentOption;
    description: string;
    dueDate: number | null;
    firstDueDate: number | null;
    upfrontDueDate: number | null;
  }>({
    title: "", selectedOption: "installment", description: "",
    dueDate: null, firstDueDate: null, upfrontDueDate: null,
  });

  const calculateMutation = useInstallmentVsCashCalculateMutation();
  const saveMutation = useSaveInstallmentVsCashMutation();
  const createGoalMutation = useCreateGoalFromInstallmentVsCashMutation();
  const createPlannedExpenseMutation = useCreatePlannedExpenseFromInstallmentVsCashMutation();

  sessionStore.restore();

  const premiumAccessQuery: UseQueryReturnType<boolean, Error> = useQuery({
    queryKey: ["entitlements", "advanced_simulations", INSTALLMENT_VS_CASH_TOOL_ID],
    enabled: computed<boolean>(() => sessionStore.isAuthenticated),
    queryFn: (): Promise<boolean> => entitlementClient.checkEntitlement("advanced_simulations"),
    staleTime: STALE_TIME.STATIC,
  });

  const isAuthenticated = computed<boolean>(() => {
    sessionStore.restore();
    return sessionStore.isAuthenticated;
  });
  const hasPremiumAccess = computed<boolean>(() => premiumAccessQuery.data.value === true);
  const isBridging = computed<boolean>(() =>
    createGoalMutation.isPending.value || createPlannedExpenseMutation.isPending.value,
  );

  /**
   * Reports an operational error to observability and surfaces a friendly toast.
   *
   * @param error Original runtime error.
   * @param context Stable context label used by observability tooling.
   */
  function handleOperationalError(error: unknown, context: string): void {
    captureException(error, { context, extra: { toolId: INSTALLMENT_VS_CASH_TOOL_ID } });
    message.error(getErrorMessage(error));
  }

  /**
   * Persists the current page state before redirecting the user to login.
   *
   * @returns void
   */
  function persistContextAndRedirectToLogin(): void {
    if (calculation.value === null) { return; }
    toolContextStore.save(INSTALLMENT_VS_CASH_TOOL_ID, calculation.value, { form: form.value });
    saveRedirect(INSTALLMENT_VS_CASH_PUBLIC_PATH);
    void router.push("/login");
  }

  /**
   * Ensures a saved simulation exists before a premium bridge action.
   *
   * @returns The saved simulation reference.
   */
  async function ensureSavedSimulation(): Promise<InstallmentVsCashSavedSimulation> {
    if (savedSimulation.value !== null) { return savedSimulation.value; }
    if (calculation.value === null) {
      throw new Error(t("pages.installmentVsCash.errors.noSimulation"));
    }
    const response = await saveMutation.mutateAsync(toInstallmentVsCashCalculationRequest(form.value));
    savedSimulation.value = response.simulation;
    return response.simulation;
  }

  /** Runs the public calculation using the current form values. */
  async function handleCalculate(): Promise<void> {
    const errors = validateInstallmentVsCashForm(form.value);
    if (errors.length > 0) {
      validationMessage.value = errors[0]?.message ?? t("pages.installmentVsCash.errors.validateForm");
      return;
    }
    validationMessage.value = null;
    savedSimulation.value = null;
    try {
      calculation.value = await calculateMutation.mutateAsync(toInstallmentVsCashCalculationRequest(form.value));
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.calculate");
    }
  }

  /** Saves the current calculation or redirects the visitor to login first. */
  async function handleSave(): Promise<void> {
    if (calculation.value === null) { return; }
    if (!isAuthenticated.value) { persistContextAndRedirectToLogin(); return; }
    try {
      const response = await saveMutation.mutateAsync(toInstallmentVsCashCalculationRequest(form.value));
      savedSimulation.value = response.simulation;
      message.success(t("pages.installmentVsCash.success.saved"));
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.save");
    }
  }

  /** Opens the goal bridge or routes the user to the appropriate gate. */
  async function handleGoalAction(): Promise<void> {
    if (calculation.value === null) { return; }
    if (!isAuthenticated.value) { persistContextAndRedirectToLogin(); return; }
    if (!hasPremiumAccess.value) { void router.push("/plans"); return; }
    try {
      await ensureSavedSimulation();
      goalForm.title = form.value.scenarioLabel.trim() || t("pages.installmentVsCash.goalModal.defaultTitle");
      goalForm.selectedOption = calculation.value.result.recommendedOption === "installment" ? "installment" : "cash";
      showGoalModal.value = true;
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.goal.prefill");
    }
  }

  /** Opens the planned-expense bridge or routes the user to the appropriate gate. */
  async function handleExpenseAction(): Promise<void> {
    if (calculation.value === null) { return; }
    if (!isAuthenticated.value) { persistContextAndRedirectToLogin(); return; }
    if (!hasPremiumAccess.value) { void router.push("/plans"); return; }
    try {
      await ensureSavedSimulation();
      plannedExpenseForm.title = form.value.scenarioLabel.trim() || t("pages.installmentVsCash.expenseModal.defaultTitle");
      plannedExpenseForm.selectedOption = calculation.value.result.recommendedOption === "cash" ? "cash" : "installment";
      showExpenseModal.value = true;
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.expense.prefill");
    }
  }

  /** Submits the goal bridge modal. */
  async function submitGoalBridge(): Promise<void> {
    const simulation = savedSimulation.value;
    if (simulation === null) {
      message.error(t("pages.installmentVsCash.errors.saveBeforeGoal"));
      return;
    }
    const payload: CreateInstallmentVsCashGoalPayload = {
      title: goalForm.title.trim(),
      selectedOption: goalForm.selectedOption,
      description: goalForm.description.trim() || undefined,
      targetDate: toIsoDate(goalForm.targetDate),
    };
    try {
      const response = await createGoalMutation.mutateAsync({ simulationId: simulation.id, payload });
      savedSimulation.value = response.simulation;
      showGoalModal.value = false;
      message.success(t("pages.installmentVsCash.success.goalCreated"));
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.goal.submit");
    }
  }

  /** Submits the planned-expense bridge modal. */
  async function submitExpenseBridge(): Promise<void> {
    const simulation = savedSimulation.value;
    if (simulation === null) {
      message.error(t("pages.installmentVsCash.errors.saveBeforeExpense"));
      return;
    }
    const payload: CreateInstallmentVsCashPlannedExpensePayload = {
      title: plannedExpenseForm.title.trim(),
      selectedOption: plannedExpenseForm.selectedOption,
      description: plannedExpenseForm.description.trim() || undefined,
      dueDate: plannedExpenseForm.selectedOption === "cash" ? toIsoDate(plannedExpenseForm.dueDate) : undefined,
      firstDueDate: plannedExpenseForm.selectedOption === "installment" ? toIsoDate(plannedExpenseForm.firstDueDate) : undefined,
      upfrontDueDate: toIsoDate(plannedExpenseForm.upfrontDueDate),
    };
    try {
      const response = await createPlannedExpenseMutation.mutateAsync({ simulationId: simulation.id, payload });
      savedSimulation.value = response.simulation;
      showExpenseModal.value = false;
      message.success(
        t("pages.installmentVsCash.success.expensesCreated", { count: response.transactions.length }),
      );
    } catch (error: unknown) {
      handleOperationalError(error, "tools.installment_vs_cash.expense.submit");
    }
  }

  onMounted((): void => {
    toolContextStore.restore();
    if (toolContextStore.pendingToolId !== INSTALLMENT_VS_CASH_TOOL_ID) { return; }
    if (isInstallmentVsCashPendingPayload(toolContextStore.pendingPayload)) {
      form.value = toolContextStore.pendingPayload.form;
    }
    if (isInstallmentVsCashCalculation(toolContextStore.pendingResult)) {
      calculation.value = toolContextStore.pendingResult;
    }
    toolContextStore.clear();
  });

  return {
    t, router,
    form, calculation, savedSimulation, validationMessage,
    showGoalModal, showExpenseModal, goalForm, plannedExpenseForm,
    calculateMutation, saveMutation, createGoalMutation, createPlannedExpenseMutation,
    isAuthenticated, hasPremiumAccess, isBridging,
    handleCalculate, handleSave, handleGoalAction, handleExpenseAction,
    submitGoalBridge, submitExpenseBridge,
  };
}
/* eslint-enable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
