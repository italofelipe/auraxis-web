/** Severity levels supported by the Auraxis toast system. */
export type ToastType = "success" | "error" | "warning" | "info";

/** Options for a single toast notification. */
export interface ToastOptions {
  /** Duration in milliseconds before the toast auto-dismisses. Defaults to 4 000 ms. */
  duration?: number;
  /** Whether the toast is manually dismissible. Defaults to true. */
  closable?: boolean;
}

/** Return type of the useToast composable. */
export interface UseToastReturn {
  /**
   * Shows a success toast.
   * @param message - The message to display.
   * @param options - Optional display options.
   */
  success: (message: string, options?: ToastOptions) => void;
  /**
   * Shows an error toast.
   * @param message - The message to display.
   * @param options - Optional display options.
   */
  error: (message: string, options?: ToastOptions) => void;
  /**
   * Shows a warning toast.
   * @param message - The message to display.
   * @param options - Optional display options.
   */
  warning: (message: string, options?: ToastOptions) => void;
  /**
   * Shows an info toast.
   * @param message - The message to display.
   * @param options - Optional display options.
   */
  info: (message: string, options?: ToastOptions) => void;
}
