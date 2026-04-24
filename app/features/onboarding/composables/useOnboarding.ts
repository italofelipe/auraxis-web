import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from "vue";
import { useSessionStore } from "~/stores/session";
import { useUserStore } from "~/stores/user";

export type OnboardingStepNumber = 1 | 2 | 3;

/** Shape captured from step 1 (dados básicos). */
export interface OnboardingStep1Data {
  readonly monthlyIncome: string;
  readonly investorProfile: "conservador" | "explorador" | "entusiasta";
}

/** Shape captured from step 2 (primeira transação). */
export interface OnboardingStep2Data {
  readonly title: string;
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly dueDate: string;
}

/** Shape captured from step 3 (primeira meta). */
export interface OnboardingStep3Data {
  readonly name: string;
  readonly targetAmount: string;
  readonly targetDate: string;
}

export interface OnboardingFormData {
  step1?: OnboardingStep1Data;
  step2?: OnboardingStep2Data;
  step3?: OnboardingStep3Data;
}

export interface OnboardingState {
  done: boolean;
  skipped: boolean;
  currentStep: OnboardingStepNumber;
  formData: OnboardingFormData;
}

const DEFAULT_STATE: Readonly<OnboardingState> = {
  done: false,
  skipped: false,
  currentStep: 1,
  formData: {},
};

const _state = ref<OnboardingState>({ ...DEFAULT_STATE, formData: {} });
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
 * Narrows arbitrary localStorage payload into a full `OnboardingState`,
 * filling missing fields with safe defaults. Necessary because users
 * upgrading from the legacy 4-step wizard may have persisted state without
 * `currentStep` / `formData`.
 *
 * @param raw Parsed localStorage payload, possibly partial.
 * @returns A fully-populated `OnboardingState`.
 */
function _hydrateState(raw: unknown): OnboardingState {
  if (raw === null || typeof raw !== "object") {
    return { ...DEFAULT_STATE, formData: {} };
  }
  const parsed = raw as Partial<OnboardingState>;
  const step = parsed.currentStep;
  const validStep: OnboardingStepNumber =
    step === 1 || step === 2 || step === 3 ? step : 1;
  return {
    done: parsed.done === true,
    skipped: parsed.skipped === true,
    currentStep: validStep,
    formData: parsed.formData && typeof parsed.formData === "object" ? { ...parsed.formData } : {},
  };
}

interface OnboardingActions {
  start: () => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
  setCurrentStep: (step: OnboardingStepNumber) => void;
  setStepData: <K extends keyof OnboardingFormData>(step: K, data: OnboardingFormData[K]) => void;
  getStepData: <K extends keyof OnboardingFormData>(step: K) => OnboardingFormData[K];
}

/**
 * Builds the state-mutating actions for the onboarding composable. Extracted
 * so {@link useOnboarding} stays under the project lint thresholds for
 * function length.
 *
 * @param persist Callback that flushes the current in-memory state to
 *   localStorage after every mutation.
 * @returns The set of mutators returned by {@link useOnboarding}.
 */
function _buildActions(persist: () => void): OnboardingActions {
  return {
    start: (): void => {
      _openedManually.value = true;
    },
    complete: (): void => {
      _state.value = { ...DEFAULT_STATE, done: true, skipped: false, formData: _state.value.formData, currentStep: 1 };
      _openedManually.value = false;
      persist();
    },
    skip: (): void => {
      _state.value = {
        done: false,
        skipped: true,
        currentStep: _state.value.currentStep,
        formData: _state.value.formData,
      };
      _openedManually.value = false;
      persist();
    },
    reset: (): void => {
      _state.value = { ...DEFAULT_STATE, formData: {} };
      _openedManually.value = false;
      persist();
    },
    setCurrentStep: (step: OnboardingStepNumber): void => {
      _state.value = { ..._state.value, currentStep: step };
      persist();
    },
    setStepData: <K extends keyof OnboardingFormData>(step: K, data: OnboardingFormData[K]): void => {
      _state.value = {
        ..._state.value,
        formData: { ..._state.value.formData, [step]: data },
      };
      persist();
    },
    getStepData: <K extends keyof OnboardingFormData>(step: K): OnboardingFormData[K] => {
      return _state.value.formData[step];
    },
  };
}

/**
 * Guided onboarding wizard controller — 3 steps: dados básicos,
 * primeira transação, primeira meta.
 *
 * Shows automatically on the first session after email confirmation, and can
 * be re-opened at any time via {@link OnboardingActions.start}. Persists
 * done/skipped/currentStep + per-step form data in localStorage keyed by user
 * id so a user closing the browser can resume where they left off.
 *
 * @returns Reactive state (`shouldShow`, `isSkipped`, `isDone`, `currentStep`,
 *   `formData`) plus the full {@link OnboardingActions} mutator set.
 */
export function useOnboarding(): {
  shouldShow: ComputedRef<boolean>;
  isSkipped: ComputedRef<boolean>;
  isDone: ComputedRef<boolean>;
  currentStep: ComputedRef<OnboardingStepNumber>;
  formData: Ref<OnboardingFormData>;
} & OnboardingActions {
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
        _state.value = _hydrateState(JSON.parse(raw));
      } catch {
        _state.value = { ...DEFAULT_STATE, formData: {} };
      }
    } else {
      _state.value = { ...DEFAULT_STATE, formData: {} };
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

  const isSkipped = computed((): boolean => _state.value.skipped);
  const isDone = computed((): boolean => _state.value.done);
  const currentStep = computed((): OnboardingStepNumber => _state.value.currentStep);
  const actions = _buildActions(_persist);

  return {
    shouldShow,
    isSkipped,
    isDone,
    currentStep,
    formData: computed((): OnboardingFormData => _state.value.formData) as unknown as Ref<OnboardingFormData>,
    ...actions,
  };
}
