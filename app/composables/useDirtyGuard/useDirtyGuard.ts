import { ref } from "vue";
import { useDialog } from "naive-ui";
import { useI18n } from "vue-i18n";
import type { UseDirtyGuardReturn } from "./useDirtyGuard.types";

/**
 * Composable that detects unsaved form changes and shows a confirmation dialog
 * before allowing a modal or page to close.
 *
 * Usage pattern:
 * 1. Call `markDirty()` on any `@update:value` / `@input` event in the form.
 * 2. Call `reset()` after a successful save or when explicitly discarding.
 * 3. Call `guard(onConfirm)` from the modal close handler instead of closing directly.
 *    - If the form is clean, `onConfirm` is called immediately.
 *    - If the form is dirty, a NaiveUI warning dialog is shown first.
 *
 * Must be called inside a component that has a NaiveUI dialog provider
 * (`NDialogProvider`) in its ancestor tree.
 *
 * @returns Reactive dirty state and guard helpers.
 *
 * @example
 * ```ts
 * const { isDirty, markDirty, reset, guard } = useDirtyGuard();
 *
 * // In template: @update:value="markDirty"
 * // After save:  reset()
 * // On close:    guard(() => emit('close'))
 * ```
 */
export function useDirtyGuard(): UseDirtyGuardReturn {
  const isDirty = ref(false);
  const dialog = useDialog();
  const { t } = useI18n();

  /**
   * Marks the form as having unsaved changes.
   */
  function markDirty(): void {
    isDirty.value = true;
  }

  /**
   * Clears the dirty flag. Call after a successful save or explicit discard.
   */
  function reset(): void {
    isDirty.value = false;
  }

  /**
   * Guards a close/navigate action. When the form is dirty, shows a warning
   * dialog asking the user to confirm discarding unsaved changes.
   * When the form is clean, `onConfirm` is called synchronously.
   *
   * @param onConfirm - Callback to execute when it is safe to close.
   */
  function guard(onConfirm: () => void): void {
    if (!isDirty.value) {
      onConfirm();
      return;
    }

    dialog.warning({
      title: t("dirtyGuard.title"),
      content: t("dirtyGuard.content"),
      positiveText: t("dirtyGuard.positiveText"),
      negativeText: t("dirtyGuard.negativeText"),
      onPositiveClick: () => {
        reset();
        onConfirm();
      },
    });
  }

  return { isDirty, markDirty, reset, guard };
}
