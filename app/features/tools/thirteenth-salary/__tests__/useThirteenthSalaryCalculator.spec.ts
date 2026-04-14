import { describe, expect, it } from "vitest";
import {
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
} from "../useThirteenthSalaryCalculator";

describe("useThirteenthSalaryCalculator — validateThirteenthSalaryForm", () => {
  it("returns no errors for a fully valid form", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form)).toHaveLength(0);
  });

  it("requires grossSalary to be positive (null)", () => {
    const form = { ...createDefaultThirteenthSalaryFormState(), grossSalary: null };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("requires grossSalary > 0 (zero)", () => {
    const form = { ...createDefaultThirteenthSalaryFormState(), grossSalary: 0 };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("rejects monthsWorked = 0", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 0,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "monthsWorked")).toBe(true);
  });

  it("rejects monthsWorked = 13", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 13,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "monthsWorked")).toBe(true);
  });

  it("accepts monthsWorked = 1 (partial year)", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 1,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form)).toHaveLength(0);
  });
});

describe("useThirteenthSalaryCalculator — calculateThirteenthSalary", () => {
  it("calculates full-year gross for 12 months", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(5_000);
  });

  it("calculates proportional gross for 6 months (50%)", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 6_000,
      monthsWorked: 6,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(3_000);
  });

  it("calculates proportional gross for 1 month (1/12)", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 12_000,
      monthsWorked: 1,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(1_000);
  });

  it("adds variablePay to the base salary before proportionalising", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 4_000,
      monthsWorked: 12,
      variablePay: 1_000,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(5_000);
  });

  it("subtracts advance already paid from total gross", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 1_000,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(4_000);
  });

  it("first installment has no INSS and no IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const { firstInstallment } = calculateThirteenthSalary(form);
    expect(firstInstallment.inss).toBe(0);
    expect(firstInstallment.irrf).toBe(0);
    expect(firstInstallment.net).toBe(firstInstallment.gross);
  });

  it("second installment bears all INSS and IRRF deductions", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const { secondInstallment, totalInss, totalIrrf } = calculateThirteenthSalary(form);
    expect(secondInstallment.inss).toBe(totalInss);
    expect(secondInstallment.irrf).toBe(totalIrrf);
  });

  it("totalNet equals totalGross minus totalInss minus totalIrrf", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 8_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 1,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalNet).toBeCloseTo(result.totalGross - result.totalInss - result.totalIrrf, 2);
  });

  it("salary below IRRF exemption threshold yields zero IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 1_500,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalIrrf).toBe(0);
  });

  it("does not produce negative totalGross when advance exceeds proportional base", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 2_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 3_000,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).totalGross).toBe(0);
  });

  it("first and second installment gross sum to totalGross", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 7_500,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.firstInstallment.gross + result.secondInstallment.gross).toBeCloseTo(
      result.totalGross,
      2,
    );
  });

  it("tableYear is set and is a positive integer", () => {
    const form = { ...createDefaultThirteenthSalaryFormState(), grossSalary: 4_000 };
    const result = calculateThirteenthSalary(form);
    expect(result.tableYear).toBeGreaterThan(2020);
    expect(Number.isInteger(result.tableYear)).toBe(true);
  });
});
