import type { Ref } from "vue";

/** Return type of the useDirtyGuard composable. */
export interface UseDirtyGuardReturn {
  /** True when the form has unsaved changes. */
  isDirty: Ref<boolean>;
  /**
   * Marks the form as dirty (should be called on any field change).
   */
  markDirty: () => void;
  /**
   * Resets the dirty flag (should be called after a successful save or explicit discard).
   */
  reset: () => void;
  /**
   * Guards a close action. If the form is dirty, shows a confirmation dialog.
   * `onConfirm` is called immediately when the form is clean, or after the
   * user confirms discarding unsaved changes.
   *
   * @param onConfirm - Callback to invoke when it is safe to close.
   */
  guard: (onConfirm: () => void) => void;
}
