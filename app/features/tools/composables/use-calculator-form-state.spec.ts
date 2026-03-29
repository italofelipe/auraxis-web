import { describe, it, expect } from "vitest";
import { useCalculatorFormState } from "./use-calculator-form-state";

interface TestForm extends Record<string, unknown> {
  name: string
  amount: number | null
}

/**
 * Returns the default test form initial state.
 *
 * @returns Initial TestForm instance.
 */
function createInitial(): TestForm {
  return { name: "", amount: null };
}

describe("useCalculatorFormState", () => {
  it("form starts with initial state", () => {
    const { form } = useCalculatorFormState(createInitial);
    expect(form.value).toEqual({ name: "", amount: null });
  });

  it("isDirty starts as false", () => {
    const { isDirty } = useCalculatorFormState(createInitial);
    expect(isDirty.value).toBe(false);
  });

  it("validationError starts as null", () => {
    const { validationError } = useCalculatorFormState(createInitial);
    expect(validationError.value).toBeNull();
  });

  it("patch merges partial updates into form", () => {
    const { form, patch } = useCalculatorFormState(createInitial);
    patch({ name: "Notebook" });
    expect(form.value.name).toBe("Notebook");
    expect(form.value.amount).toBeNull();
  });

  it("patch preserves existing fields not in the update", () => {
    const { form, patch } = useCalculatorFormState(createInitial);
    patch({ name: "Test" });
    patch({ amount: 500 });
    expect(form.value.name).toBe("Test");
    expect(form.value.amount).toBe(500);
  });

  it("isDirty becomes true after patch", () => {
    const { isDirty, patch } = useCalculatorFormState(createInitial);
    patch({ name: "Dirty" });
    expect(isDirty.value).toBe(true);
  });

  it("isDirty becomes false after reset", () => {
    const { isDirty, patch, reset } = useCalculatorFormState(createInitial);
    patch({ name: "Dirty" });
    reset();
    expect(isDirty.value).toBe(false);
  });

  it("reset restores initial state", () => {
    const { form, patch, reset } = useCalculatorFormState(createInitial);
    patch({ name: "Changed", amount: 999 });
    reset();
    expect(form.value).toEqual({ name: "", amount: null });
  });

  it("reset clears validationError", () => {
    const { validationError, setValidationError, reset } = useCalculatorFormState(createInitial);
    setValidationError("Some error");
    reset();
    expect(validationError.value).toBeNull();
  });

  it("setValidationError sets an error message", () => {
    const { validationError, setValidationError } = useCalculatorFormState(createInitial);
    setValidationError("Required field missing");
    expect(validationError.value).toBe("Required field missing");
  });

  it("setValidationError clears the error when called with null", () => {
    const { validationError, setValidationError } = useCalculatorFormState(createInitial);
    setValidationError("Error");
    setValidationError(null);
    expect(validationError.value).toBeNull();
  });

  it("patch clears validationError", () => {
    const { validationError, setValidationError, patch } = useCalculatorFormState(createInitial);
    setValidationError("Validation failed");
    patch({ name: "Fixed" });
    expect(validationError.value).toBeNull();
  });

  it("uses the initial state factory each time reset is called", () => {
    let counter = 0;
    /**
     * Returns a uniquely named form state on each invocation.
     *
     * @returns TestForm with incremented name.
     */
    const factory = (): TestForm => {
      counter += 1;
      return { name: `initial-${counter}`, amount: null };
    };

    const { form, patch, reset } = useCalculatorFormState(factory);
    expect(form.value.name).toBe("initial-1");

    patch({ name: "changed" });
    reset();
    expect(form.value.name).toBe("initial-2");
  });
});
