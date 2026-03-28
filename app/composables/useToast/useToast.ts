import { useMessage } from "naive-ui";
import type { ToastOptions, UseToastReturn } from "./useToast.types";

/**
 * Composable that wraps NaiveUI's useMessage into a unified toast API.
 *
 * Provides consistent duration defaults and a stable interface so that
 * callers remain decoupled from the underlying notification library.
 *
 * Must be called inside a component setup function or composable that
 * runs inside a NaiveUI message provider context.
 *
 * @returns Object with success, error, warning and info toast helpers.
 */
export function useToast(): UseToastReturn {
  const message = useMessage();

  const DEFAULT_DURATION = 3000;

  return {
    success(content: string, options?: ToastOptions): void {
      message.success(content, { duration: options?.duration ?? DEFAULT_DURATION });
    },

    error(content: string, options?: ToastOptions): void {
      message.error(content, { duration: options?.duration ?? DEFAULT_DURATION });
    },

    warning(content: string, options?: ToastOptions): void {
      message.warning(content, { duration: options?.duration ?? DEFAULT_DURATION });
    },

    info(content: string, options?: ToastOptions): void {
      message.info(content, { duration: options?.duration ?? DEFAULT_DURATION });
    },
  };
}
