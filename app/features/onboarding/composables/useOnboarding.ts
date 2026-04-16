import { computed, onMounted, ref, watch, type ComputedRef } from "vue";
import { useSessionStore } from "~/stores/session";
import { useUserStore } from "~/stores/user";

export interface OnboardingState {
  done: boolean;
  skipped: boolean;
}

const DEFAULT_STATE: Readonly<OnboardingState> = { done: false, skipped: false };

const _state = ref<OnboardingState>({ ...DEFAULT_STATE });
const _openedManually = ref<boolean>(false);
let _hydratedForKey = "";

/**
 * Builds the localStorage key scoped to the current user id (or guest).
 *
 * @param uid - The authenticated user id, or null/undefined for unauth sessions.
 * @returns The namespaced localStorage key used to persist onboarding state.
 */
function _keyFor(uid: string | null | undefined): string {
  return `auraxis:onboarding:${uid ?? "guest"}`;
}

/**
 * Guided onboarding tour controller.
 *
 * Shows automatically on the first session after email confirmation, and can
 * be re-opened at any time via {@link start}. Persists done/skipped state in
 * localStorage keyed by user id so the auto-trigger fires only once per user.
 *
 * @returns Reactive `shouldShow` and the `start` / `complete` / `skip` /
 *   `reset` controls that all share a single module-level state.
 */
export function useOnboarding(): {
  shouldShow: ComputedRef<boolean>;
  start: () => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
} {
  const userStore = useUserStore();
  const sessionStore = useSessionStore();

  const _currentKey = computed((): string => _keyFor(userStore.profile?.id ?? sessionStore.userEmail));

  /** Loads persisted state from localStorage the first time we see a key. */
  function _hydrate(): void {
    if (typeof localStorage === "undefined") { return; }
    const key = _currentKey.value;
    if (_hydratedForKey === key) { return; }
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        _state.value = JSON.parse(raw) as OnboardingState;
      } catch {
        _state.value = { ...DEFAULT_STATE };
      }
    } else {
      _state.value = { ...DEFAULT_STATE };
    }
    _hydratedForKey = key;
  }

  /** Writes the current in-memory state to localStorage. */
  function _persist(): void {
    if (typeof localStorage === "undefined") { return; }
    localStorage.setItem(_currentKey.value, JSON.stringify(_state.value));
  }

  onMounted(_hydrate);
  watch(_currentKey, _hydrate);

  const shouldShow = computed((): boolean => {
    if (_openedManually.value) { return true; }
    if (_state.value.done || _state.value.skipped) { return false; }
    if (!userStore.isLoaded) { return false; }
    return sessionStore.emailConfirmed === true;
  });

  /** Re-opens the tour on demand (e.g. from the help trigger button). */
  function start(): void {
    _openedManually.value = true;
  }

  /** Marks the tour as completed and closes it. */
  function complete(): void {
    _state.value = { done: true, skipped: false };
    _openedManually.value = false;
    _persist();
  }

  /** Marks the tour as skipped and closes it. */
  function skip(): void {
    _state.value = { done: false, skipped: true };
    _openedManually.value = false;
    _persist();
  }

  /** Clears persisted state so the auto-trigger fires again on next session. */
  function reset(): void {
    _state.value = { ...DEFAULT_STATE };
    _openedManually.value = false;
    _persist();
  }

  return { shouldShow, start, complete, skip, reset };
}
