/** Options for configuring a toast notification. */
export interface ToastOptions {
  /** Duration in milliseconds before the toast auto-dismisses. Defaults to 3000. */
  duration?: number;
}

/** Unified toast API returned by useToast. */
export interface UseToastReturn {
  /** Shows a success (green) toast. */
  success: (content: string, options?: ToastOptions) => void;
  /** Shows an error (red) toast. */
  error: (content: string, options?: ToastOptions) => void;
  /** Shows a warning (orange) toast. */
  warning: (content: string, options?: ToastOptions) => void;
  /** Shows an informational (blue) toast. */
  info: (content: string, options?: ToastOptions) => void;
}
