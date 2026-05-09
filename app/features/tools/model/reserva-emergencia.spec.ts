import { describe, expect, it } from "vitest";

import {
  calculateReservaEmergencia,
  createDefaultReservaEmergenciaFormState,
  validateReservaEmergenciaForm,
  PROFILE_OPTIONS,
  type ReservaEmergenciaFormState,
} from "./reserva-emergencia";

describe("validateReservaEmergenciaForm", () => {
  it("returns error when monthlyExpenses is null", () => {
    const form = createDefaultReservaEmergenciaFormState();
    const errors = validateReservaEmergenciaForm(form);
    expect(errors.some((e) => e.field === "monthlyExpenses")).toBe(true);
  });

  it("returns error when monthlyContribution is null", () => {
    const form = { ...createDefaultReservaEmergenciaFormState(), monthlyExpenses: 3000 };
    const errors = validateReservaEmergenciaForm(form);
    expect(errors.some((e) => e.field === "monthlyContribution")).toBe(true);
  });

  it("returns no errors with valid form", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
    };
    expect(validateReservaEmergenciaForm(form)).toHaveLength(0);
  });

  it("returns error when monthlyExpenses is zero", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 0,
      monthlyContribution: 500,
    };
    expect(validateReservaEmergenciaForm(form).some((e) => e.field === "monthlyExpenses")).toBe(true);
  });
});

describe("calculateReservaEmergencia", () => {
  it("calculates target as 6x expenses for CLT estável", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(18000);
    expect(result.profileMonths).toBe(6);
  });

  it("calculates target as 9x expenses for CLT instável", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 4000,
      monthlyContribution: 800,
      profile: "clt_instavel",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(36000);
    expect(result.profileMonths).toBe(9);
  });

  it("calculates target as 12x expenses for PJ", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 5000,
      monthlyContribution: 1000,
      profile: "pj",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(60000);
    expect(result.profileMonths).toBe(12);
  });

  it("calculates target as 12x expenses for autônomo", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3500,
      monthlyContribution: 700,
      profile: "autonomo",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(42000);
    expect(result.profileMonths).toBe(12);
  });

  it("calculates target as 3x expenses for aposentado", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 2000,
      monthlyContribution: 300,
      profile: "aposentado",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(6000);
    expect(result.profileMonths).toBe(3);
  });

  it("calculates target as 18x expenses for empresario", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 4000,
      monthlyContribution: 800,
      profile: "empresario",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(72000);
    expect(result.profileMonths).toBe(18);
  });

  it("considers currentReserve in gap calculation", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      currentReserve: 10000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.gap).toBe(8000); // 18000 - 10000
  });

  it("gap is 0 when reserve exceeds target", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 2000,
      monthlyContribution: 500,
      currentReserve: 20000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.gap).toBe(0);
    expect(result.monthsToTarget).toBe(0);
  });

  it("generates timeline with month 0 as starting point", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 1000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.timeline[0]!.month).toBe(0);
    expect(result.timeline[0]!.balance).toBe(0);
    expect(result.timeline.length).toBeGreaterThan(1);
  });

  it("generates investment comparisons for all 4 vehicles", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 1000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.investments).toHaveLength(4);
    expect(result.investments[0]!.name).toContain("Selic");
  });

  it("poupanca takes longer than selic", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    const selic = result.investments.find((i) => i.name.includes("Selic"));
    const poupanca = result.investments.find((i) => i.name.includes("Poupança"));
    expect(poupanca!.monthsToTarget).toBeGreaterThan(selic!.monthsToTarget);
  });

  it("higher return rate leads to fewer months to target", () => {
    const base = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      profile: "clt" as const,
      currentReserve: 0,
    };
    const lowRate = calculateReservaEmergencia({ ...base, annualReturnPct: 5 });
    const highRate = calculateReservaEmergencia({ ...base, annualReturnPct: 15 });
    expect(highRate.monthsToTarget).toBeLessThanOrEqual(lowRate.monthsToTarget);
  });

  it("higher monthly contribution leads to fewer months to target", () => {
    const base = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      profile: "clt" as const,
      currentReserve: 0,
      annualReturnPct: 12.25,
    };
    const lowContrib = calculateReservaEmergencia({ ...base, monthlyContribution: 300 });
    const highContrib = calculateReservaEmergencia({ ...base, monthlyContribution: 1000 });
    expect(highContrib.monthsToTarget).toBeLessThan(lowContrib.monthsToTarget);
  });

  it("timeline balance grows monotonically with positive rate and contribution", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 5000,
      monthlyContribution: 1000,
      profile: "clt",
      annualReturnPct: 12,
    };
    const result = calculateReservaEmergencia(form);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i]!.balance).toBeGreaterThanOrEqual(result.timeline[i - 1]!.balance);
    }
  });

  it("PROFILE_OPTIONS includes all profiles with correct month multipliers", () => {
    const profiles = Object.fromEntries(PROFILE_OPTIONS.map((p) => [p.value, p.months]));
    expect(profiles["clt"]).toBe(6);
    expect(profiles["clt_instavel"]).toBe(9);
    expect(profiles["pj"]).toBe(12);
    expect(profiles["autonomo"]).toBe(12);
    expect(profiles["aposentado"]).toBe(3);
    expect(profiles["empresario"]).toBe(18);
  });

  it("targetAmount is always a multiple of monthlyExpenses", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 2500,
      monthlyContribution: 400,
      profile: "pj",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(2500 * result.profileMonths);
  });
});
