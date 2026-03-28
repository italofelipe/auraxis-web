import { useDialog } from "naive-ui";
import type { ConfirmOptions, UseConfirmReturn } from "./useConfirm.types";

/**
 * Composable that wraps NaiveUI's useDialog into a simplified confirmation API.
 *
 * Provides a single `confirm` helper that opens a "warning" style dialog
 * (orange header) — the standard Auraxis pattern for destructive or
 * irreversible actions.
 *
 * Must be called inside a component that has a NaiveUI dialog provider
 * in its ancestor tree.
 *
 * @returns Object with a `confirm` helper function.
 *
 * @example
 * ```ts
 * const { confirm } = useConfirm();
 * confirm({
 *   title: "Excluir meta",
 *   content: "Essa ação não pode ser desfeita.",
 *   onConfirm: () => deleteGoalMutation.mutate(id),
 * });
 * ```
 */
export function useConfirm(): UseConfirmReturn {
  const dialog = useDialog();

  /**
   * Opens a NaiveUI warning dialog with the given options.
   * @param options - Dialog configuration including title, content and callbacks.
   */
  function confirm(options: ConfirmOptions): void {
    dialog.warning({
      title: options.title,
      content: options.content,
      positiveText: options.positiveText ?? "Confirmar",
      negativeText: options.negativeText ?? "Cancelar",
      onPositiveClick: options.onConfirm,
      onNegativeClick: options.onCancel,
    });
  }

  return { confirm };
}
