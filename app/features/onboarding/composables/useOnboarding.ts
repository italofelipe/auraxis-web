import type { ComputedRef } from "vue";
import { useSessionStore } from "~/stores/session";
import { useUserStore } from "~/stores/user";

export interface OnboardingState {
  done: boolean;
  skipped: boolean;
}

const DEFAULT_STATE: Readonly<OnboardingState> = { done: false, skipped: false };

/**
 * Composable that controls the onboarding wizard visibility and persistence.
 *
 * The wizard shows on the first login after email confirmation when the user
 * profile is still incomplete.  Once the user completes or skips the wizard
 * the preference is stored in `localStorage` and the wizard never appears again.
 *
 * @returns Reactive wizard state and action methods.
 */
export function useOnboarding(): {
  shouldShow: ComputedRef<boolean>;
  complete: () => void;
  skip: () => void;
  reset: () => void;
} {
  const userStore = useUserStore();
  const sessionStore = useSessionStore();

  const _storageKey = computed((): string => {
    const uid = userStore.profile?.id ?? sessionStore.userEmail ?? "guest";
    return `auraxis:onboarding:${uid}`;
  });

  const _state = ref<OnboardingState>({ ...DEFAULT_STATE });

  onMounted((): void => {
    _loadFromStorage();
  });

  /** Reads persisted onboarding state from localStorage into reactive state. */
  function _loadFromStorage(): void {
    if (typeof localStorage === "undefined") { return; }
    const raw = localStorage.getItem(_storageKey.value);
    if (!raw) { return; }
    try {
      _state.value = JSON.parse(raw) as OnboardingState;
    } catch {
      _state.value = { ...DEFAULT_STATE };
    }
  }

  /** Writes the current onboarding state to localStorage. */
  function _persist(): void {
    if (typeof localStorage === "undefined") { return; }
    localStorage.setItem(_storageKey.value, JSON.stringify(_state.value));
  }

  /** True when the wizard should be shown to the current user. */
  const shouldShow = computed((): boolean => {
    if (_state.value.done || _state.value.skipped) { return false; }
    if (!userStore.isLoaded) { return false; }
    if (userStore.isProfileComplete) { return false; }
    return sessionStore.emailConfirmed === true;
  });

  /** Marks the wizard as completed (all steps finished). */
  function complete(): void {
    _state.value = { done: true, skipped: false };
    _persist();
  }

  /** Marks the wizard as skipped — will not show again. */
  function skip(): void {
    _state.value = { done: false, skipped: true };
    _persist();
  }

  /** Resets the onboarding state (for testing / re-trigger). */
  function reset(): void {
    _state.value = { ...DEFAULT_STATE };
    _persist();
  }

  return { shouldShow, complete, skip, reset };
}
