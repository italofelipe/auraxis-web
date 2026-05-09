import { describe, expect, it } from "vitest";

import {
  calculateSalarioLiquido,
  createDefaultSalarioLiquidoFormState,
  validateSalarioLiquidoForm,
  type SalarioLiquidoFormState,
} from "./salario-liquido";

describe("validateSalarioLiquidoForm", () => {
  it("returns error when grossSalary is null", () => {
    const form = createDefaultSalarioLiquidoFormState();
    const errors = validateSalarioLiquidoForm(form);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe("grossSalary");
  });

  it("returns error when grossSalary is zero", () => {
    const form = { ...createDefaultSalarioLiquidoFormState(), grossSalary: 0 };
    const errors = validateSalarioLiquidoForm(form);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe("grossSalary");
  });

  it("returns no errors when grossSalary is provided", () => {
    const form = { ...createDefaultSalarioLiquidoFormState(), grossSalary: 5000 };
    expect(validateSalarioLiquidoForm(form)).toHaveLength(0);
  });
});

describe("calculateSalarioLiquido", () => {
  it("calculates net salary for a basic R$5000 gross", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
    };
    const result = calculateSalarioLiquido(form);

    expect(result.grossSalary).toBe(5000);
    expect(result.inss).toBeGreaterThan(0);
    expect(result.irrf).toBeGreaterThanOrEqual(0);
    expect(result.vtDiscount).toBe(300); // 6% of 5000
    expect(result.netSalary).toBeLessThan(5000);
    expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
  });

  it("includes VT discount at 6% by default", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.vtDiscount).toBe(180); // 6% of 3000
  });

  it("skips VT when opted out", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
      vtOptOut: true,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.vtDiscount).toBe(0);
  });

  it("applies union contribution as 1 day of salary", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
      unionContribution: true,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.unionDiscount).toBe(100); // 3000/30
  });

  it("applies alimony percentage", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 10000,
      alimonyPct: 30,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.alimonyDiscount).toBe(3000);
  });

  it("calculates employer total cost", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.employerFgts).toBe(400); // 8%
    expect(result.employerInss).toBe(1000); // 20%
    expect(result.employerTotal).toBe(6400); // 5000 + 400 + 1000
  });

  it("includes health plan and VA/VR deductions", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
      healthPlanDiscount: 200,
      vaVrDiscount: 100,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.healthPlanDiscount).toBe(200);
    expect(result.vaVrDiscount).toBe(100);
    expect(result.deductions.find((d) => d.label === "Plano de Saúde")?.amount).toBe(200);
    expect(result.deductions.find((d) => d.label === "VA/VR")?.amount).toBe(100);
  });

  it("deductions sum equals totalDeductions", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8000,
      dependents: 2,
      healthPlanDiscount: 300,
      vaVrDiscount: 150,
      alimonyPct: 10,
      unionContribution: true,
    };
    const result = calculateSalarioLiquido(form);
    const sumDeductions = result.deductions.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sumDeductions - result.totalDeductions)).toBeLessThan(0.02);
  });

  it("handles minimum wage correctly", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 1518,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.inss).toBe(113.85); // 1518 * 7.5%
    expect(result.irrf).toBe(0); // Below exemption
    expect(result.netSalary).toBeGreaterThan(0);
  });

  it("net salary equals gross minus total deductions for all combinations", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 12000,
      dependents: 3,
      healthPlanDiscount: 500,
      vaVrDiscount: 200,
      alimonyPct: 20,
      unionContribution: true,
      pgblPct: 12,
    };
    const result = calculateSalarioLiquido(form);
    const computed = result.grossSalary - result.totalDeductions;
    expect(Math.abs(result.netSalary - computed)).toBeLessThan(0.02);
  });
});

describe("calculateSalarioLiquido — employer costs and edge cases", () => {
  it("applies INSS ceiling for high salaries above teto", () => {
    // Teto INSS 2025 = R$ 8.157,41; max contribution ~R$ 908.86
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 20000,
    };
    const result = calculateSalarioLiquido(form);
    // INSS should be capped, not 20000 * 14%
    expect(result.inss).toBeLessThan(1200);
    expect(result.inss).toBeGreaterThan(800);
  });

  it("zero dependents results in no dependent deduction applied", () => {
    const form0: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 4000,
      dependents: 0,
    };
    const form2: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 4000,
      dependents: 2,
    };
    const res0 = calculateSalarioLiquido(form0);
    const res2 = calculateSalarioLiquido(form2);
    // More dependents = less IRRF = higher net salary
    expect(res2.irrf).toBeLessThanOrEqual(res0.irrf);
    expect(res2.netSalary).toBeGreaterThanOrEqual(res0.netSalary);
  });

  it("employer cost is always greater than gross salary", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 7000,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.employerTotal).toBeGreaterThan(result.grossSalary);
  });

  it("employer FGTS is exactly 8% of gross", () => {
    const gross = 6500;
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: gross,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.employerFgts).toBe(Math.round(gross * 0.08 * 100) / 100);
  });

  it("employer INSS is exactly 20% of gross", () => {
    const gross = 6500;
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: gross,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.employerInss).toBe(Math.round(gross * 0.20 * 100) / 100);
  });

  it("deductions list only includes non-zero items", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
      vtOptOut: true,
      healthPlanDiscount: 0,
      vaVrDiscount: 0,
      alimonyPct: 0,
      unionContribution: false,
    };
    const result = calculateSalarioLiquido(form);
    // Only INSS and IRRF should be present (VT is opt-out)
    const labels = result.deductions.map((d) => d.label);
    expect(labels).not.toContain("Vale-Transporte");
    expect(labels).not.toContain("VA/VR");
    expect(labels).not.toContain("Plano de Saúde");
  });

  it("applies VT at custom rate correctly", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 4000,
      vtPct: 3,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.vtDiscount).toBe(120); // 3% of 4000
  });

  it("PGBL deduction reduces IRRF taxable base", () => {
    const formWithPgbl: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8000,
      pgblPct: 12,
    };
    const formWithout: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8000,
      pgblPct: 0,
    };
    const withPgbl = calculateSalarioLiquido(formWithPgbl);
    const without = calculateSalarioLiquido(formWithout);
    // PGBL reduces taxable base, so IRRF should be less or equal
    expect(withPgbl.irrf).toBeLessThanOrEqual(without.irrf);
  });

  it("alimony discount is zero when pct is 0", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
      alimonyPct: 0,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.alimonyDiscount).toBe(0);
    expect(result.deductions.find((d) => d.label === "Pensão Alimentícia")).toBeUndefined();
  });

  it("handles salary just above INSS ceiling with correct top-bracket calculation", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8200,
    };
    const result = calculateSalarioLiquido(form);
    // At 8200 (above 8157.41 ceiling), INSS is maxed
    // salary at teto: calcInss(8157.41) should equal calcInss(8200)
    const formAtTeto: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8157.41,
    };
    const resultAtTeto = calculateSalarioLiquido(formAtTeto);
    expect(result.inss).toBe(resultAtTeto.inss);
  });

  it("IRRF is zero for salary below exemption threshold after INSS", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 2000,
    };
    const result = calculateSalarioLiquido(form);
    // Net taxable base is 2000 - INSS(~120.88) - 0 dependents = ~1879 < 2259.20 threshold
    expect(result.irrf).toBe(0);
  });

  it("union discount is absent in deductions list when not enabled", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
      unionContribution: false,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.unionDiscount).toBe(0);
    expect(result.deductions.find((d) => d.label === "Contribuição Sindical")).toBeUndefined();
  });

  it("all deductions are non-negative", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 1518,
      dependents: 5,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.inss).toBeGreaterThanOrEqual(0);
    expect(result.irrf).toBeGreaterThanOrEqual(0);
    expect(result.vtDiscount).toBeGreaterThanOrEqual(0);
    expect(result.netSalary).toBeGreaterThanOrEqual(0);
  });
});
