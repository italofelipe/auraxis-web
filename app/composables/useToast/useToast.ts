import { useMessage } from "naive-ui";
import type { ToastType, ToastOptions, UseToastReturn } from "./useToast.types";

/**
 * Default duration in milliseconds for toast messages.
 * Matches the value used in createApiMutation for consistency.
 */
const DEFAULT_DURATION_MS = 4_000;

/**
 * Extra time (ms) added on top of a toast's `duration` before its dedup key is
 * released. Covers the leave animation so a key isn't freed while the toast is
 * still fading out, which would let a rapid duplicate slip through (#977).
 */
const DEDUP_RELEASE_BUFFER_MS = 500;

/**
 * Module-level set of currently-active dedup keys (`${severity}:${msg}`).
 *
 * Shared across every `useToast()` caller so concurrent failures (e.g. a token
 * expiry firing many requests) collapse into a single visible toast instead of
 * stacking identical copies. Combined with `:max="1"` on `<NMessageProvider>`,
 * this guarantees at most one toast on screen and no duplicate-while-active.
 */
const activeToastKeys = new Set<string>();

/**
 * Clears the module-level dedup set. Test-only — production code never needs to
 * drop active keys. Exported so specs can isolate state between cases.
 */
export const __resetToastDedupForTests = (): void => {
  activeToastKeys.clear();
};

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
   * Shows a toast of the given severity, deduping identical-while-active ones.
   *
   * Suppresses the call when a toast with the same `${severity}:${msg}` key is
   * already active. Otherwise it registers the key, forwards to Naive UI, and
   * schedules the key's release after `duration + buffer` (and also on the
   * message's own `onClose`, so manual dismissal frees it early). Different text
   * or a different severity is never suppressed.
   *
   * @param severity - Toast severity level.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function show(severity: ToastType, msg: string, options?: ToastOptions): void {
    const key = `${severity}:${msg}`;
    if (activeToastKeys.has(key)) {
      return;
    }

    const { duration, closable } = resolveOptions(options);
    activeToastKeys.add(key);

    /** Frees the dedup key so an identical toast can be shown again. */
    const release = (): void => {
      activeToastKeys.delete(key);
    };

    // Timer-based release covers auto-dismiss; `onClose` releases early on
    // manual dismissal. The timer also guarantees the key is freed even if
    // Naive UI never fires `onClose`, so dedup can't wedge permanently.
    const timer = setTimeout(release, duration + DEDUP_RELEASE_BUFFER_MS);

    /** Releases the key early when the user dismisses the toast manually. */
    const onClose = (): void => {
      clearTimeout(timer);
      release();
    };

    message[severity](msg, { duration, closable, onClose });
  }

  /**
   * Shows a success toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function success(msg: string, options?: ToastOptions): void {
    show("success", msg, options);
  }

  /**
   * Shows an error toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function error(msg: string, options?: ToastOptions): void {
    show("error", msg, options);
  }

  /**
   * Shows a warning toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function warning(msg: string, options?: ToastOptions): void {
    show("warning", msg, options);
  }

  /**
   * Shows an info toast.
   * @param msg - Message content.
   * @param options - Display options.
   */
  function info(msg: string, options?: ToastOptions): void {
    show("info", msg, options);
  }

  return { success, error, warning, info };
}
