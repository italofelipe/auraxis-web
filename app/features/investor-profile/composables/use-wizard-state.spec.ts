import { ref } from "vue";
import { describe, it, expect } from "vitest";
import { useWizardState } from "./use-wizard-state";

describe("useWizardState — initial state", () => {
  it("starts at step 1", () => {
    const wizard = useWizardState(ref(5));
    expect(wizard.currentStep.value).toBe(1);
  });

  it("starts with no answers", () => {
    const wizard = useWizardState(ref(5));
    expect(wizard.answers.value.size).toBe(0);
  });

  it("isComplete is false initially", () => {
    const wizard = useWizardState(ref(5));
    expect(wizard.isComplete.value).toBe(false);
  });

  it("canGoNext is false when no answer for step 1", () => {
    const wizard = useWizardState(ref(5));
    expect(wizard.canGoNext.value).toBe(false);
  });
});

describe("useWizardState — selectAnswer", () => {
  it("records the answer for the given questionId", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 2);
    expect(wizard.answers.value.get(1)).toBe(2);
  });

  it("allows overwriting an existing answer", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.selectAnswer(1, 3);
    expect(wizard.answers.value.get(1)).toBe(3);
  });

  it("makes canGoNext true when current step has been answered", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 2);
    expect(wizard.canGoNext.value).toBe(true);
  });
});

describe("useWizardState — goNext / goPrev", () => {
  it("advances to the next step", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.goNext();
    expect(wizard.currentStep.value).toBe(2);
  });

  it("does not advance past the last step", () => {
    const wizard = useWizardState(ref(3));
    wizard.currentStep.value = 3;
    wizard.goNext();
    expect(wizard.currentStep.value).toBe(3);
  });

  it("goes back to the previous step", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.goNext();
    wizard.goPrev();
    expect(wizard.currentStep.value).toBe(1);
  });

  it("does not go below step 1", () => {
    const wizard = useWizardState(ref(5));
    wizard.goPrev();
    expect(wizard.currentStep.value).toBe(1);
  });
});

describe("useWizardState — isComplete", () => {
  it("is true when all questions are answered", () => {
    const total = ref(3);
    const wizard = useWizardState(total);
    wizard.selectAnswer(1, 1);
    wizard.selectAnswer(2, 2);
    wizard.selectAnswer(3, 3);
    expect(wizard.isComplete.value).toBe(true);
  });

  it("is false when not all questions are answered", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.selectAnswer(2, 2);
    expect(wizard.isComplete.value).toBe(false);
  });

  it("is false when totalSteps is 0", () => {
    const wizard = useWizardState(ref(0));
    expect(wizard.isComplete.value).toBe(false);
  });
});

describe("useWizardState — reset", () => {
  it("resets step to 1", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.goNext();
    wizard.goNext();
    wizard.reset();
    expect(wizard.currentStep.value).toBe(1);
  });

  it("clears all answers", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 2);
    wizard.selectAnswer(2, 3);
    wizard.reset();
    expect(wizard.answers.value.size).toBe(0);
  });

  it("makes isComplete false after reset", () => {
    const total = ref(2);
    const wizard = useWizardState(total);
    wizard.selectAnswer(1, 1);
    wizard.selectAnswer(2, 2);
    expect(wizard.isComplete.value).toBe(true);
    wizard.reset();
    expect(wizard.isComplete.value).toBe(false);
  });
});

describe("useWizardState — getAnswersArray", () => {
  it("returns answers sorted by questionId", () => {
    const wizard = useWizardState(ref(3));
    wizard.selectAnswer(3, 1);
    wizard.selectAnswer(1, 3);
    wizard.selectAnswer(2, 2);
    expect(wizard.getAnswersArray()).toEqual([3, 2, 1]);
  });

  it("returns empty array when no answers", () => {
    const wizard = useWizardState(ref(5));
    expect(wizard.getAnswersArray()).toEqual([]);
  });

  it("returns partial answers sorted by questionId", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(2, 2);
    wizard.selectAnswer(4, 3);
    expect(wizard.getAnswersArray()).toEqual([2, 3]);
  });
});

describe("useWizardState — canGoNext reactivity", () => {
  it("updates canGoNext when advancing to a step without an answer", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.goNext();
    expect(wizard.currentStep.value).toBe(2);
    expect(wizard.canGoNext.value).toBe(false);
  });

  it("updates canGoNext to true when answering the new step", () => {
    const wizard = useWizardState(ref(5));
    wizard.selectAnswer(1, 1);
    wizard.goNext();
    wizard.selectAnswer(2, 3);
    expect(wizard.canGoNext.value).toBe(true);
  });
});
