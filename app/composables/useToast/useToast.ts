import { useMessage } from "naive-ui";
import type { ToastOptions, UseToastReturn } from "./useToast.types";

/**
 * Default duration in milliseconds for toast messages.
 * Matches the value used in createApiMutation for consistency.
 */
const DEFAULT_DURATION_MS = 4_000;

/**
 * Unified toast composable for Auraxis Web.
 *
 * Wraps Naive UI's `useMessage` behind a stable, typed API that covers all
 * severity levels used in the product (success, error, warning, info).
 *
 * Must be called inside a component whose ancestor tree includes `NMessageProvider`
 * (already provided globally in `app.vue`).
 *
 * Prefer this over direct `useMessage()` calls so toast behaviour (duration,
 * closability) can be tuned in one place.
 *
 * @returns Object with helpers for each toast severity level.
 *
 * @example
 * ```ts
 * const { success, error } = useToast();
 * success("Transação salva com sucesso.");
 * error("Falha ao carregar dados. Tente novamente.", { duration: 6000 });
 * ```
 */
export function useToast(): UseToastReturn {
  const message = useMessage();

  /**
   * Resolves effective options with sensible defaults.
   * @param options - Caller-supplied options (may be undefined).
   * @returns Resolved options with defaults applied.
   */
  function resolveOptions(options?: ToastOptions): {
    duration: number;
    closable: boolean;
  } {
    return {
      duration: options?.duration ?? DEFAULT_DURATION_MS,
      closable: options?.closable ?? true,
    };
  }

  /**
   * Shows a success toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function success(msg: string, options?: ToastOptions): void {
    const { duration, closable } = resolveOptions(options);
    message.success(msg, { duration, closable });
  }

  /**
   * Shows an error toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function error(msg: string, options?: ToastOptions): void {
    const { duration, closable } = resolveOptions(options);
    message.error(msg, { duration, closable });
  }

  /**
   * Shows a warning toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function warning(msg: string, options?: ToastOptions): void {
    const { duration, closable } = resolveOptions(options);
    message.warning(msg, { duration, closable });
  }

  /**
   * Shows an info toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function info(msg: string, options?: ToastOptions): void {
    const { duration, closable } = resolveOptions(options);
    message.info(msg, { duration, closable });
  }

  return { success, error, warning, info };
}
