import { describe, expect, it } from "vitest";
import {
  calculateHoraExtra,
  CLT_DEFAULT_HOURS_PER_MONTH,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
} from "../useHoraExtraCalculator";

describe("useHoraExtraCalculator — validateHoraExtraForm", () => {
  it("returns no errors for a fully valid form", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5_000,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form)).toHaveLength(0);
  });

  it("requires grossSalary to be positive (null)", () => {
    const form = { ...createDefaultHoraExtraFormState(), grossSalary: null, hours50: 4 };
    expect(validateHoraExtraForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("requires grossSalary > 0 (zero)", () => {
    const form: HoraExtraFormState = {
      grossSalary: 0,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("requires hoursPerMonth to be positive", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_000,
      hoursPerMonth: 0,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form).some((e) => e.field === "hoursPerMonth")).toBe(true);
  });

  it("requires at least one overtime hour across all rates", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_000,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form).some((e) => e.field === "hours50")).toBe(true);
  });

  it("rejects negative overtime hours", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_000,
      hoursPerMonth: 220,
      hours50: -1,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form).some((e) => e.field === "hours50")).toBe(true);
  });

  it("accepts hours75 > 0 without hours50", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_000,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 4,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form)).toHaveLength(0);
  });
});

describe("useHoraExtraCalculator — calculateHoraExtra", () => {
  it("computes hourly rate from grossSalary / hoursPerMonth", () => {
    const form: HoraExtraFormState = {
      grossSalary: 2_200,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.hourlyRate).toBeCloseTo(2_200 / CLT_DEFAULT_HOURS_PER_MONTH, 2);
  });

  it("overtime50 grossAmount equals hours × hourlyRate × 1.5", () => {
    const form: HoraExtraFormState = {
      grossSalary: 2_200,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    const hourlyRate = 2_200 / CLT_DEFAULT_HOURS_PER_MONTH;
    expect(result.overtime50.grossAmount).toBeCloseTo(10 * hourlyRate * 1.5, 2);
  });

  it("overtime75 grossAmount equals hours × hourlyRate × 1.75", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_300,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 0,
      hours75: 8,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    const hourlyRate = 3_300 / CLT_DEFAULT_HOURS_PER_MONTH;
    expect(result.overtime75.grossAmount).toBeCloseTo(8 * hourlyRate * 1.75, 2);
  });

  it("overtime100 grossAmount equals hours × hourlyRate × 2.0", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4_400,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 0,
      hours75: 0,
      hours100: 4,
    };
    const result = calculateHoraExtra(form);
    const hourlyRate = 4_400 / CLT_DEFAULT_HOURS_PER_MONTH;
    expect(result.overtime100.grossAmount).toBeCloseTo(4 * hourlyRate * 2.0, 2);
  });

  it("totalOvertimeGross is sum of all modality gross amounts", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5_000,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 4,
      hours75: 2,
      hours100: 1,
    };
    const result = calculateHoraExtra(form);
    expect(result.totalOvertimeGross).toBeCloseTo(
      result.overtime50.grossAmount + result.overtime75.grossAmount + result.overtime100.grossAmount,
      2,
    );
  });

  it("inssOvertimeImpact = inssOnCombined − inssOnBase", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_500,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.inssOvertimeImpact).toBeCloseTo(result.inssOnCombined - result.inssOnBase, 2);
  });

  it("netOvertimeEstimate = totalOvertimeGross − inssOvertimeImpact", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3_500,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.netOvertimeEstimate).toBeCloseTo(
      result.totalOvertimeGross - result.inssOvertimeImpact,
      2,
    );
  });

  it("falls back to CLT_DEFAULT_HOURS_PER_MONTH when hoursPerMonth is 0", () => {
    const form: HoraExtraFormState = {
      grossSalary: 2_200,
      hoursPerMonth: 0,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.hoursPerMonth).toBe(CLT_DEFAULT_HOURS_PER_MONTH);
  });

  it("tableYear is set and is a positive integer", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4_000,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 5,
      hours75: 0,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.tableYear).toBeGreaterThan(2020);
    expect(Number.isInteger(result.tableYear)).toBe(true);
  });

  it("zero hours for a rate produces zero grossAmount for that rate", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5_000,
      hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
      hours50: 0,
      hours75: 4,
      hours100: 0,
    };
    const result = calculateHoraExtra(form);
    expect(result.overtime50.grossAmount).toBe(0);
    expect(result.overtime100.grossAmount).toBe(0);
  });
});
