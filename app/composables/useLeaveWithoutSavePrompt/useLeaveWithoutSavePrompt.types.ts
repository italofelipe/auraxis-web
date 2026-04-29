import type { Ref } from "vue";

export interface LeaveWithoutSavePromptOptions {
  /**
   * Reactive flag describing whether the page has computed a result that
   * has not yet been persisted. The prompt only fires when this is `true`.
   */
  readonly isDirty: Ref<boolean>;
  /**
   * Async callback invoked when the user picks "Salvar e sair" in the modal.
   * Should resolve once the simulation has been persisted. Errors are
   * surfaced to the caller via the returned error ref so the page can
   * decide whether to keep the user on screen.
   */
  readonly onSave: () => Promise<void>;
  /**
   * Optional callback invoked when the user picks "Descartar e sair".
   * Useful for clearing local state, telemetry, etc.
   */
  readonly onDiscard?: () => void;
}

export interface LeaveWithoutSavePromptReturn {
  /**
   * Whether a save attempt triggered by the prompt is currently running.
   * Pages can use this to disable form interactions while the modal awaits
   * the network round-trip.
   */
  readonly isSaving: Ref<boolean>;
  /**
   * The most recent save error, if any. Cleared between prompt
   * invocations.
   */
  readonly saveError: Ref<unknown | null>;
  /**
   * Manually evaluates the current dirty state and runs the prompt
   * imperatively (e.g. when the page exposes a custom "Cancelar" button).
   * Resolves to `true` when the caller can proceed with the navigation
   * or close action; `false` when the user opted to stay.
   */
  readonly confirmLeave: () => Promise<boolean>;
}
