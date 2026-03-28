import type { DeepReadonly, Ref, ComputedRef } from "vue";

/** Return type of the useErrorBoundary composable. */
export interface UseErrorBoundaryReturn {
  /** The captured error, or null when no error is present. Readonly. */
  error: DeepReadonly<Ref<Error | null>>;
  /** Whether an error is currently captured. */
  hasError: ComputedRef<boolean>;
  /**
   * Captures an error.
   * Accepts any thrown value and normalises it to an Error instance.
   * @param err - The caught value.
   */
  capture: (err: unknown) => void;
  /** Clears the captured error and resets hasError to false. */
  reset: () => void;
}
