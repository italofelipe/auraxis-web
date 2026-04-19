import { computed, ref, type ComputedRef, type Ref } from "vue";
import { captureException } from "~/core/observability";
import {
  useCalculatorFormState,
  type CalculatorFormStateReturn,
} from "./use-calculator-form-state";
import { useToolPageContext, type ToolPageContext } from "./use-tool-page-context";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import type { SaveSimulationPayload } from "~/features/simulations/model/simulation";
import type { CreateGoalPayload } from "~/features/goals/contracts/goal.dto";

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

interface SimulationPayloadContext<TForm, TResult> {
  form: TForm;
  result: TResult;
  t: TranslateFn;
}

interface GoalPayloadContext<TResult> {
  result: TResult;
  form: unknown;
  t: TranslateFn;
}

export interface UseToolPageOptions<
  TForm extends Record<string, unknown>,
  TResult,
> {
  createDefaultState: () => TForm;
  buildSimulationPayload: (
    ctx: SimulationPayloadContext<TForm, TResult>,
  ) => Omit<SaveSimulationPayload, "goalId">;
  getGoalPayload?: (ctx: GoalPayloadContext<TResult>) => CreateGoalPayload;
}

export interface UseToolPageReturn<
  TForm extends Record<string, unknown>,
  TResult,
> extends ToolPageContext,
    CalculatorFormStateReturn<TForm> {
  result: Ref<TResult | null>;
  savedSimulationId: Ref<string | null>;
  goalAdded: Ref<boolean>;
  saveSimulationMutation: ReturnType<typeof useSaveSimulationMutation>;
  createGoalMutation: ReturnType<typeof useCreateGoalMutation>;
  ensureSimulationSaved: () => Promise<string | null>;
  handleSaveSimulation: () => Promise<void>;
  handleAddAsGoal: () => Promise<void>;
  isBridging: ComputedRef<boolean>;
  isSaved: ComputedRef<boolean>;
}

/**
 * Factory composable for tool calculator pages.
 *
 * Centralises: auth/session state, i18n helpers, form state management,
 * save-simulation and create-goal mutations, and their async handlers.
 * Each tool page calls this once and provides tool-specific payload builders
 * via callbacks. Only page-specific UI logic (calculate, validate, template)
 * stays in the page component.
 *
 * @param options - Configuration with state factory and simulation/goal payload builders.
 * @returns Shared reactive state, mutations, and handlers for the tool page.
 */
export function useToolPage<
  TForm extends Record<string, unknown>,
  TResult,
>(
  options: UseToolPageOptions<TForm, TResult>,
): UseToolPageReturn<TForm, TResult> {
  const context = useToolPageContext();
  const { t, toast, getErrorMessage } = context;

  const formState = useCalculatorFormState<TForm>(options.createDefaultState);
  const { form } = formState;

  const result = ref<TResult | null>(null) as Ref<TResult | null>;
  const savedSimulationId = ref<string | null>(null);
  const goalAdded = ref(false);

  const saveSimulationMutation = useSaveSimulationMutation();
  // Only instantiate the goal mutation when the page actually supports goals.
  // This avoids pulling in useGoalsClient (and its Naive UI dependencies) for
  // pages that never need it, which prevents test environment setup failures.
  const createGoalMutation = (
    options.getGoalPayload !== null && options.getGoalPayload !== undefined
      ? useCreateGoalMutation()
      : { mutateAsync: async (): Promise<Record<string, never>> => ({}), isPending: ref(false) }
  ) as ReturnType<typeof useCreateGoalMutation>;

  /**
   * Saves the simulation if not already saved.
   *
   * @returns Simulation id on success, or null when result is absent or save fails.
   */
  async function ensureSimulationSaved(): Promise<string | null> {
    if (savedSimulationId.value) { return savedSimulationId.value; }
    if (!result.value) { return null; }

    try {
      const payload = options.buildSimulationPayload({
        form: form.value,
        result: result.value,
        t,
      });
      const simulation = await saveSimulationMutation.mutateAsync(payload);
      savedSimulationId.value = simulation.id;
      return simulation.id;
    } catch (err) {
      captureException(err, { context: "useToolPage/save-simulation" });
      toast.error(getErrorMessage(err));
      return null;
    }
  }

  /** Triggers a save of the current simulation. */
  async function handleSaveSimulation(): Promise<void> {
    await ensureSimulationSaved();
  }

  /** Saves the simulation (if needed) then creates a goal from the result. */
  async function handleAddAsGoal(): Promise<void> {
    if (!result.value || goalAdded.value || !options.getGoalPayload) { return; }

    await ensureSimulationSaved();

    if (!result.value) { return; }

    try {
      const goalPayload = options.getGoalPayload({
        result: result.value,
        form: form.value,
        t,
      });
      await createGoalMutation!.mutateAsync(goalPayload);
      goalAdded.value = true;
    } catch (err) {
      captureException(err, { context: "useToolPage/add-as-goal" });
      toast.error(getErrorMessage(err));
    }
  }

  const isBridging = computed(
    () =>
      saveSimulationMutation.isPending.value ||
      (createGoalMutation?.isPending.value ?? false),
  );

  const isSaved = computed(() => savedSimulationId.value !== null);

  return {
    ...context,
    ...formState,
    result,
    savedSimulationId,
    goalAdded,
    saveSimulationMutation,
    createGoalMutation,
    ensureSimulationSaved,
    handleSaveSimulation,
    handleAddAsGoal,
    isBridging,
    isSaved,
  };
}
