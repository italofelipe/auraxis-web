import { ref, computed, readonly } from "vue";
import { captureException } from "~/core/observability";
import type { UseErrorBoundaryReturn } from "./useErrorBoundary.types";

/**
 * Composable for local error boundary state.
 *
 * Captures thrown values (Error instances, strings, or anything else),
 * normalises them to Error, forwards to the observability layer and
 * exposes reactive state that the template can render.
 *
 * Intended for use in page and section components that need to show
 * an inline error state without crashing the entire app.
 *
 * @returns Reactive error state and capture/reset helpers.
 *
 * @example
 * ```ts
 * const { hasError, error, capture, reset } = useErrorBoundary();
 *
 * async function loadData() {
 *   try {
 *     data.value = await fetchData();
 *   } catch (err) {
 *     capture(err);
 *   }
 * }
 * ```
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const error = ref<Error | null>(null);
  const hasError = computed(() => error.value !== null);

  /**
   * Captures a thrown value, normalises it to an Error and forwards to observability.
   * @param err - Any value caught in a try/catch block.
   */
  function capture(err: unknown): void {
    const normalized = err instanceof Error ? err : new Error(String(err));
    error.value = normalized;
    captureException(normalized);
  }

  /** Clears the captured error and resets hasError to false. */
  function reset(): void {
    error.value = null;
  }

  return {
    error: readonly(error),
    hasError,
    capture,
    reset,
  };
}
