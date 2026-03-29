import { ref, type Ref } from "vue";

export interface CalculatorFormStateReturn<TForm extends Record<string, unknown>> {
  /** Reactive form state */
  form: Ref<TForm>
  /** Current validation error message, or null if none */
  validationError: Ref<string | null>
  /** True when the form has been modified since the last reset */
  isDirty: Ref<boolean>
  /** Merges a partial update into the current form state */
  patch: (update: Partial<TForm>) => void
  /** Resets the form to the initial state produced by the factory */
  reset: () => void
  /** Sets or clears the validation error message */
  setValidationError: (message: string | null) => void
}

/**
 * Generic composable for managing calculator form state.
 *
 * @param createInitialState Factory function that returns a fresh initial state.
 * @returns Reactive form state with patch, reset, and validation helpers.
 */
export function useCalculatorFormState<TForm extends Record<string, unknown>>(
  createInitialState: () => TForm,
): CalculatorFormStateReturn<TForm> {
  const form = ref<TForm>(createInitialState()) as Ref<TForm>;
  const validationError = ref<string | null>(null);
  const isDirty = ref(false);

  /**
   * Merges a partial update into the current form state and marks it dirty.
   *
   * @param update Partial state to merge.
   */
  function patch(update: Partial<TForm>): void {
    form.value = { ...form.value, ...update };
    isDirty.value = true;
    validationError.value = null;
  }

  /**
   * Resets the form to the initial state produced by the factory.
   */
  function reset(): void {
    form.value = createInitialState();
    validationError.value = null;
    isDirty.value = false;
  }

  /**
   * Sets or clears the current validation error message.
   *
   * @param message Error message string, or null to clear.
   */
  function setValidationError(message: string | null): void {
    validationError.value = message;
  }

  return { form, validationError, isDirty, patch, reset, setValidationError };
}
