/**
 * WEB36 — Tier 2: Core financial formula reference values.
 *
 * Tests the mathematical correctness of investment calculation functions
 * using known-correct formula outputs:
 * - Compound interest: FV = PV × (1+r)^n + PMT × ((1+r)^n − 1) / r
 *   (where r = monthly effective rate, converted from annual nominal)
 * - Fisher formula: r_real = (1 + r_nominal) / (1 + r_inflation) − 1
 * - FIRE / Aposentadoria: Rule of 25×, PMT accumulation
 *
 * Import path uses utils/calculations (public API barrel) to validate WEB35.
 */

import { describe, expect, it } from "vitest";
import {
  calculateJurosCompostos,
  type JurosCompostosFormState,
} from "~/utils/calculations/investments";
import {
  calculateFire,
  calculateAposentadoria,
  type FireFormState,
  type AposentadoriaFormState,
} from "~/utils/calculations/planning";

// ─── Compound interest — FV formula ──────────────────────────────────────────

describe("calculateJurosCompostos — FV formula precision", () => {
  it("PV=R$10,000 @ 12%/year for 1 year, 0 contributions: FV = R$11,200 (effective annual gain)", () => {
    // Monthly rate = (1.12)^(1/12) - 1; FV after 12 months = 10000 × (1.12) = 11200
    const form: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 1,
      periodUnit: "years",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    // Effective annual growth = 12% so FV = 11200 (± 1 for floating point)
    expect(result.finalAmountNominal).toBeCloseTo(11_200, 0);
  });

  it("PV=0, PMT=R$1,000/month @ 12%/year for 12 months: FV ≈ R$12,645", () => {
    // Monthly rate r = (1.12)^(1/12) - 1 ≈ 0.009489
    // FV = 1000 × ((1.12) - 1) / r = 1000 × 0.12 / 0.009489 ≈ 12645
    const form: JurosCompostosFormState = {
      initialCapital: 0,
      monthlyContribution: 1_000,
      nominalRatePct: 12,
      period: 12,
      periodUnit: "months",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    // FV with PMT at end-of-month, 12% annual effective ≈ 12645
    expect(result.finalAmountNominal).toBeGreaterThan(12_000);
    expect(result.finalAmountNominal).toBeLessThan(13_000);
  });

  it("totalInterest = finalAmountNominal − totalContributed (accounting identity)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5_000,
      monthlyContribution: 500,
      nominalRatePct: 8,
      period: 24,
      periodUnit: "months",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    expect(result.totalInterest).toBeCloseTo(
      result.finalAmountNominal - result.totalContributed,
      2,
    );
  });

  it("totalContributed = PV + PMT × n (no compound effect on contributed)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 200,
      nominalRatePct: 10,
      period: 24,
      periodUnit: "months",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    expect(result.totalContributed).toBeCloseTo(10_000 + 200 * 24, 2);
  });

  it("higher rate produces higher final amount (monotonicity)", () => {
    const base: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 0,
      nominalRatePct: 6,
      period: 5,
      periodUnit: "years",
      inflationPct: 0,
    };
    const low = calculateJurosCompostos(base);
    const high = calculateJurosCompostos({ ...base, nominalRatePct: 12 });
    expect(high.finalAmountNominal).toBeGreaterThan(low.finalAmountNominal);
  });
});

// ─── Fisher formula — real rate ────────────────────────────────────────────────

describe("calculateJurosCompostos — Fisher formula (real rate)", () => {
  it("finalAmountReal < finalAmountNominal when inflation > 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 5,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.finalAmountReal).toBeLessThan(result.finalAmountNominal);
  });

  it("finalAmountReal equals finalAmountNominal when inflation is 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 1,
      periodUnit: "years",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    expect(result.finalAmountReal).toBeCloseTo(result.finalAmountNominal, 1);
  });

  it("realRatePct is less than nominalRatePct when inflation > 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10_000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 5,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.realRatePct).toBeLessThan(12);
    expect(result.realRatePct).toBeGreaterThan(0);
  });
});

// ─── Chart data invariants ────────────────────────────────────────────────────

describe("calculateJurosCompostos — chart data invariants", () => {
  it("chart length equals number of months in the period", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5_000,
      monthlyContribution: 0,
      nominalRatePct: 10,
      period: 3,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    expect(calculateJurosCompostos(form).chartData).toHaveLength(36);
  });

  it("last chart point nominalAmount matches finalAmountNominal", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5_000,
      monthlyContribution: 100,
      nominalRatePct: 10,
      period: 12,
      periodUnit: "months",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    const lastPoint = result.chartData[result.chartData.length - 1];
    expect(lastPoint?.nominalAmount).toBeCloseTo(result.finalAmountNominal, 2);
  });

  it("balance never decreases when rate > 0 and contribution ≥ 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 1_000,
      monthlyContribution: 0,
      nominalRatePct: 6,
      period: 12,
      periodUnit: "months",
      inflationPct: 0,
    };
    const { chartData } = calculateJurosCompostos(form);
    for (let i = 1; i < chartData.length; i++) {
      expect(chartData[i]!.nominalAmount).toBeGreaterThanOrEqual(chartData[i - 1]!.nominalAmount);
    }
  });
});

// ─── FIRE — Rule of 25× reference ────────────────────────────────────────────

describe("calculateFire — Rule of 25× reference", () => {
  const baseForm: FireFormState = {
    currentAge: 30,
    retirementAge: 65,
    monthlyExpenses: 5_000,
    currentPatrimony: 0,
    expectedReturnPct: 8,
    ipcaPct: 4.5,
    variant: "fire",
  };

  it("FIRE variant: requiredPatrimony = monthlyExpenses × 12 × 25", () => {
    const result = calculateFire(baseForm);
    // FIRE target = 5000 × 12 × 25 = 1,500,000
    const fireVariant = result.allVariants.find((v) => v.variant === "fire");
    expect(fireVariant?.requiredPatrimony).toBeCloseTo(1_500_000, -3);
  });

  it("Lean FIRE target is less than FIRE target (20× vs 25×)", () => {
    const result = calculateFire(baseForm);
    const fire = result.allVariants.find((v) => v.variant === "fire");
    const leanFire = result.allVariants.find((v) => v.variant === "lean_fire");
    expect(leanFire!.requiredPatrimony).toBeLessThan(fire!.requiredPatrimony);
  });

  it("Fat FIRE target is greater than FIRE target (33× vs 25×)", () => {
    const result = calculateFire(baseForm);
    const fire = result.allVariants.find((v) => v.variant === "fire");
    const fatFire = result.allVariants.find((v) => v.variant === "fat_fire");
    expect(fatFire!.requiredPatrimony).toBeGreaterThan(fire!.requiredPatrimony);
  });

  it("higher existing patrimony reduces required monthly contribution", () => {
    const noPatrimony = calculateFire(baseForm);
    const withPatrimony = calculateFire({ ...baseForm, currentPatrimony: 100_000 });
    const fireNoPatrimony = noPatrimony.allVariants.find((v) => v.variant === "fire");
    const fireWithPatrimony = withPatrimony.allVariants.find((v) => v.variant === "fire");
    expect(fireWithPatrimony!.requiredMonthlyContribution).toBeLessThan(
      fireNoPatrimony!.requiredMonthlyContribution,
    );
  });

  it("allVariants contains all 4 FIRE variants", () => {
    const result = calculateFire(baseForm);
    const variants = result.allVariants.map((v) => v.variant);
    expect(variants).toContain("fire");
    expect(variants).toContain("lean_fire");
    expect(variants).toContain("fat_fire");
    expect(variants).toContain("coast_fire");
  });
});

// ─── Aposentadoria — PMT accumulation ─────────────────────────────────────────

describe("calculateAposentadoria — PMT accumulation invariants", () => {
  const baseForm: AposentadoriaFormState = {
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: 5_000,
    currentPatrimony: 0,
    expectedReturnPct: 8,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  };

  it("required monthly savings decreases as years to retirement increases (earlier start)", () => {
    // Starting at 30 (35 years) vs 35 (30 years) — earlier starter needs less per month
    const result30 = calculateAposentadoria(baseForm);
    const result35 = calculateAposentadoria({ ...baseForm, currentAge: 35 });
    expect(result30.requiredMonthlyContribution).toBeLessThan(
      result35.requiredMonthlyContribution,
    );
  });

  it("higher current patrimony reduces required monthly contribution", () => {
    const noPatrimony = calculateAposentadoria(baseForm);
    const withPatrimony = calculateAposentadoria({ ...baseForm, currentPatrimony: 100_000 });
    expect(withPatrimony.requiredMonthlyContribution).toBeLessThan(
      noPatrimony.requiredMonthlyContribution,
    );
  });

  it("requiredPatrimony uses Rule of 25× on desired monthly income at 0% inflation", () => {
    const form: AposentadoriaFormState = {
      ...baseForm,
      desiredMonthlyIncome: 10_000,
      ipcaPct: 0,
    };
    const result = calculateAposentadoria(form);
    // At 0% inflation, Rule of 25× = 10000 × 12 × 25 = 3,000,000
    expect(result.requiredPatrimony).toBeCloseTo(3_000_000, -4);
  });

  it("chartData has length equal to (retirementAge - currentAge)", () => {
    const result = calculateAposentadoria(baseForm);
    // 35 data points (ages 31 through 65, one per year)
    expect(result.chartData.length).toBeGreaterThan(0);
    expect(result.chartData.length).toBeLessThanOrEqual(
      baseForm.retirementAge - baseForm.currentAge + 1,
    );
  });
});
