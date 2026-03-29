import { computed, ref, type ComputedRef, type Ref } from "vue";

/**
 * Return type for the wizard state composable.
 */
export interface WizardState {
  /** Current step index (1-based). */
  readonly currentStep: Ref<number>;
  /** Map of questionId → selected points for each answered question. */
  readonly answers: Ref<Map<number, number>>;
  /** True when all steps have been answered. */
  readonly isComplete: ComputedRef<boolean>;
  /** True when the current step has been answered (user may advance). */
  readonly canGoNext: ComputedRef<boolean>;
  /**
   * Records the user's answer for the given question.
   * @param questionId The question identifier.
   * @param points The point value of the selected option.
   */
  selectAnswer(questionId: number, points: number): void;
  /** Advances to the next step (no-op if on the last step). */
  goNext(): void;
  /** Goes back to the previous step (no-op if on the first step). */
  goPrev(): void;
  /** Resets wizard to step 1 and clears all answers. */
  reset(): void;
  /**
   * Returns the answers as an ordered array of point values,
   * sorted by question ID ascending.
   */
  getAnswersArray(): number[];
}

/**
 * Manages multi-step wizard state for the investor profile questionnaire.
 *
 * @param totalSteps Reactive reference to the total number of steps/questions.
 * @returns Reactive wizard state and control methods.
 */
export function useWizardState(totalSteps: Ref<number>): WizardState {
  const currentStep = ref<number>(1);
  const answers = ref<Map<number, number>>(new Map());

  const isComplete = computed<boolean>(
    () => answers.value.size >= totalSteps.value && totalSteps.value > 0,
  );

  const canGoNext = computed<boolean>(() => {
    // Current step questionId is 1-based and matches currentStep
    return answers.value.has(currentStep.value);
  });

  /**
   * Records the user's answer for a given question.
   * @param questionId - The question identifier.
   * @param points - The point value of the selected option.
   */
  const selectAnswer = (questionId: number, points: number): void => {
    answers.value = new Map(answers.value).set(questionId, points);
  };

  /** Advances to the next step (no-op if on the last step). */
  const goNext = (): void => {
    if (currentStep.value < totalSteps.value) {
      currentStep.value += 1;
    }
  };

  /** Goes back to the previous step (no-op if on the first step). */
  const goPrev = (): void => {
    if (currentStep.value > 1) {
      currentStep.value -= 1;
    }
  };

  /** Resets wizard to step 1 and clears all answers. */
  const reset = (): void => {
    currentStep.value = 1;
    answers.value = new Map();
  };

  /**
   * Returns the answers as an ordered array of point values sorted by question ID.
   * @returns Array of point values in question order.
   */
  const getAnswersArray = (): number[] => {
    const sortedKeys = Array.from(answers.value.keys()).sort((a, b) => a - b);
    return sortedKeys.map((key) => answers.value.get(key) as number);
  };

  return {
    currentStep,
    answers,
    isComplete,
    canGoNext,
    selectAnswer,
    goNext,
    goPrev,
    reset,
    getAnswersArray,
  };
}
