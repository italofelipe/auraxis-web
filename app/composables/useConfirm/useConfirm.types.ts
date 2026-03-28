/** Options for the confirm dialog. */
export interface ConfirmOptions {
  /** Dialog title shown in the header. */
  title: string;
  /** Descriptive message shown in the body. */
  content: string;
  /** Label for the affirmative action button. Defaults to "Confirmar". */
  positiveText?: string;
  /** Label for the cancel button. Defaults to "Cancelar". */
  negativeText?: string;
  /**
   * Callback invoked when the user confirms.
   * May be async — the dialog's loading state is managed automatically.
   */
  onConfirm: () => void | Promise<void>;
  /** Optional callback invoked when the user cancels. */
  onCancel?: () => void;
}

/** Return type of the useConfirm composable. */
export interface UseConfirmReturn {
  /**
   * Opens a confirmation dialog with the given options.
   * @param options - Dialog configuration.
   */
  confirm: (options: ConfirmOptions) => void;
}
