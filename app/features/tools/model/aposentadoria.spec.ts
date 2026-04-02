import { describe, expect, it } from "vitest";
import {
  APOSENTADORIA_TABLE_YEAR,
  calculateAposentadoria,
  createDefaultAposentadoriaFormState,
  validateAposentadoriaForm,
  type AposentadoriaFormState,
} from "./aposentadoria";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("Aposentadoria constants", () => {
  it("APOSENTADORIA_TABLE_YEAR is 2025", () => {
    expect(APOSENTADORIA_TABLE_YEAR).toBe(2025);
  });
});

// ─── validateAposentadoriaForm ────────────────────────────────────────────────

describe("validateAposentadoriaForm", () => {
  it("returns no errors for a valid form", () => {
    const form: AposentadoriaFormState = {
      currentAge: 30,
      retirementAge: 65,
      desiredMonthlyIncome: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      lifeExpectancy: 90,
    };
    expect(validateAposentadoriaForm(form)).toHaveLength(0);
  });

  it("returns error when retirementAge <= currentAge", () => {
    const form: AposentadoriaFormState = {
      ...createDefaultAposentadoriaFormState(),
      currentAge: 40,
      retirementAge: 35,
      desiredMonthlyIncome: 5000,
    };
    const errors = validateAposentadoriaForm(form);
    expect(errors.some((e) => e.field === "retirementAge")).toBe(true);
  });

  it("returns error when retirementAge equals currentAge", () => {
    const form: AposentadoriaFormState = {
      ...createDefaultAposentadoriaFormState(),
      currentAge: 40,
      retirementAge: 40,
      desiredMonthlyIncome: 5000,
    };
    expect(validateAposentadoriaForm(form).some((e) => e.field === "retirementAge")).toBe(true);
  });

  it("returns error when desiredMonthlyIncome is null", () => {
    const form = createDefaultAposentadoriaFormState();
    const errors = validateAposentadoriaForm(form);
    expect(errors.some((e) => e.field === "desiredMonthlyIncome")).toBe(true);
  });

  it("returns error when desiredMonthlyIncome is zero", () => {
    const form: AposentadoriaFormState = {
      ...createDefaultAposentadoriaFormState(),
      desiredMonthlyIncome: 0,
    };
    expect(validateAposentadoriaForm(form).some((e) => e.field === "desiredMonthlyIncome")).toBe(true);
  });

  it("returns error when expectedReturnPct is zero", () => {
    const form: AposentadoriaFormState = {
      ...createDefaultAposentadoriaFormState(),
      desiredMonthlyIncome: 5000,
      expectedReturnPct: 0,
    };
    expect(validateAposentadoriaForm(form).some((e) => e.field === "expectedReturnPct")).toBe(true);
  });

  it("returns error when lifeExpectancy <= retirementAge", () => {
    const form: AposentadoriaFormState = {
      ...createDefaultAposentadoriaFormState(),
      desiredMonthlyIncome: 5000,
      retirementAge: 65,
      lifeExpectancy: 60,
    };
    expect(validateAposentadoriaForm(form).some((e) => e.field === "lifeExpectancy")).toBe(true);
  });
});

// ─── calculateAposentadoria — required patrimony ──────────────────────────────

describe("calculateAposentadoria — required patrimony", () => {
  const baseForm: AposentadoriaFormState = {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };

  it("requiredPatrimony = desiredIncome * 12 / 0.04 (Rule of 25x)", () => {
    const result = calculateAposentadoria(baseForm);
    expect(result.requiredPatrimony).toBeCloseTo(5000 * 300, 0);
  });

  it("requiredPatrimony for R$10k/month is R$3 million", () => {
    const result = calculateAposentadoria({ ...baseForm, desiredMonthlyIncome: 10000 });
    expect(result.requiredPatrimony).toBeCloseTo(3_000_000, 0);
  });

  it("monthsToRetirement = (retirementAge - currentAge) * 12", () => {
    const result = calculateAposentadoria(baseForm);
    expect(result.monthsToRetirement).toBe(420);
  });
});

// ─── calculateAposentadoria — monthly contribution ────────────────────────────

describe("calculateAposentadoria — monthly contribution", () => {
  const baseForm: AposentadoriaFormState = {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };

  it("requiredMonthlyContribution is positive when currentPatrimony < requiredPatrimony", () => {
    expect(calculateAposentadoria(baseForm).requiredMonthlyContribution).toBeGreaterThan(0);
  });

  it("requiredMonthlyContribution is 0 when currentPatrimony already exceeds required", () => {
    const result = calculateAposentadoria({
      ...baseForm,
      currentPatrimony: 5_000_000,
    });
    expect(result.requiredMonthlyContribution).toBe(0);
  });

  it("more time → lower required monthly contribution", () => {
    const early = calculateAposentadoria({ ...baseForm, currentAge: 25 });
    const late = calculateAposentadoria({ ...baseForm, currentAge: 40 });
    expect(early.requiredMonthlyContribution).toBeLessThan(late.requiredMonthlyContribution);
  });

  it("higher return → lower required monthly contribution", () => {
    const lowReturn = calculateAposentadoria({ ...baseForm, expectedReturnPct: 6 });
    const highReturn = calculateAposentadoria({ ...baseForm, expectedReturnPct: 10 });
    expect(highReturn.requiredMonthlyContribution).toBeLessThan(lowReturn.requiredMonthlyContribution);
  });
});

// ─── calculateAposentadoria — chart data ──────────────────────────────────────

describe("calculateAposentadoria — chart data", () => {
  const baseForm: AposentadoriaFormState = {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };

  it("chartData starts at currentAge", () => {
    const result = calculateAposentadoria(baseForm);
    expect(result.chartData[0]?.age).toBe(30);
  });

  it("chartData ends at retirementAge", () => {
    const result = calculateAposentadoria(baseForm);
    const lastPoint = result.chartData[result.chartData.length - 1];
    expect(lastPoint?.age).toBe(65);
  });

  it("chartData patrimony grows monotonically with positive PMT", () => {
    const result = calculateAposentadoria(baseForm);
    for (let i = 1; i < result.chartData.length; i++) {
      expect(result.chartData[i]!.patrimony).toBeGreaterThanOrEqual(result.chartData[i - 1]!.patrimony);
    }
  });
});

// ─── calculateAposentadoria — sensitivity ────────────────────────────────────

describe("calculateAposentadoria — sensitivity", () => {
  const baseForm: AposentadoriaFormState = {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };

  it("retiring 5 years later reduces required contribution (sensitivityMinus20pct)", () => {
    const result = calculateAposentadoria(baseForm);
    expect(result.sensitivityMinus20pct).toBeLessThan(result.requiredMonthlyContribution);
  });

  it("retiring 5 years earlier increases required contribution (sensitivityPlus20pct)", () => {
    const result = calculateAposentadoria(baseForm);
    expect(result.sensitivityPlus20pct).toBeGreaterThan(result.requiredMonthlyContribution);
  });
});

// ─── calculateAposentadoria — real return ────────────────────────────────────

describe("calculateAposentadoria — real return", () => {
  it("realReturnPct is less than expectedReturnPct when IPCA > 0", () => {
    const form: AposentadoriaFormState = {
      currentAge: 30,
      retirementAge: 65,
      desiredMonthlyIncome: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      lifeExpectancy: 90,
    };
    const result = calculateAposentadoria(form);
    expect(result.realReturnPct).toBeLessThan(form.expectedReturnPct);
  });

  it("realReturnPct is positive when expectedReturn > IPCA", () => {
    const form: AposentadoriaFormState = {
      currentAge: 30,
      retirementAge: 65,
      desiredMonthlyIncome: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      lifeExpectancy: 90,
    };
    expect(calculateAposentadoria(form).realReturnPct).toBeGreaterThan(0);
  });
});
