/** Props for the UiInlineError component. */
export interface UiInlineErrorProps {
  /**
   * Short descriptive title shown above the message.
   * @default "Não foi possível carregar"
   */
  title?: string;
  /** Optional detail message (e.g. the error.message string). */
  message?: string;
  /**
   * Label for the retry action button.
   * When not provided the button is not rendered.
   */
  retryLabel?: string;
}

/** Emits for the UiInlineError component. */
export interface UiInlineErrorEmits {
  /** Emitted when the user clicks the retry button. */
  (e: "retry"): void;
}
