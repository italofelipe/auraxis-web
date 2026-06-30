/**
 * Session-scoped gating + auto-open decision for the Payments Assistant.
 *
 * The assistant must appear at most once per browser session and only after the
 * higher-priority gates (email verification, onboarding) have resolved. These
 * helpers keep that decision pure (and the persistence injectable) so it is
 * fully unit-testable without a real browser.
 */

/** `sessionStorage` key marking that the assistant was already shown this session. */
export const ASSISTANT_SESSION_KEY = "auraxis:payments_assistant_shown";

/** Inputs that decide whether the assistant should auto-open on entry. */
export interface AutoOpenParams {
  /** Whether the `payments_assistant` feature flag is enabled. */
  readonly flagEnabled: boolean;
  /** Whether the current user is entitled to Premium surfaces. */
  readonly isPremium: boolean;
  /** Whether the assistant was already shown in this session. */
  readonly shownThisSession: boolean;
  /** Number of overdue open transactions available to review. */
  readonly candidateCount: number;
  /** Whether a higher-priority modal (email gate, onboarding) is holding the surface. */
  readonly heldByOtherModals: boolean;
}

/**
 * Decides whether the assistant should auto-open for the current entry.
 *
 * @param params Gating inputs.
 * @returns True only when every condition is satisfied.
 */
export const shouldAutoOpenAssistant = (params: AutoOpenParams): boolean =>
  params.flagEnabled &&
  params.isPremium &&
  !params.shownThisSession &&
  !params.heldByOtherModals &&
  params.candidateCount > 0;

/**
 * Reads whether the assistant has already been shown this session.
 *
 * @param storage Storage backend (defaults to `sessionStorage`).
 * @returns True when the shown flag is set.
 */
export const wasAssistantShown = (storage: Storage = sessionStorage): boolean =>
  storage.getItem(ASSISTANT_SESSION_KEY) === "1";

/**
 * Marks the assistant as shown for the remainder of this session.
 *
 * @param storage Storage backend (defaults to `sessionStorage`).
 */
export const markAssistantShown = (storage: Storage = sessionStorage): void => {
  storage.setItem(ASSISTANT_SESSION_KEY, "1");
};
