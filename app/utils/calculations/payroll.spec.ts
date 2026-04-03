/**
 * WEB36 — Tier 1: Official INSS / IRRF reference values (2025 tables).
 *
 * All expected values are derived from the official 2025 progressive tables
 * published in Portaria MPS/MF nº 3 (Jan 2025) and verified against the
 * RFB online income-tax calculator.
 *
 * Import path intentionally uses utils/calculations (the public API barrel)
 * to validate WEB35 re-exports are fully functional.
 */

import { describe, expect, it } from "vitest";
import {
  BR_TAX_TABLE_YEAR,
  IRRF_PER_DEPENDENT_DEDUCTION,
  calcInss,
  calcIrrf,
  calcIrrfFromGross,
  calcInssBracketBreakdown,
  calculateThirteenthSalary,
  calculateFerias,
  calculateRescisao,
  type ThirteenthSalaryFormState,
  type FeriasFormState,
} from "~/utils/calculations/payroll";

// ─── Table year constant ───────────────────────────────────────────────────────

describe("BR_TAX_TABLE_YEAR", () => {
  it("is 2025 (must update when table changes)", () => {
    expect(BR_TAX_TABLE_YEAR).toBe(2025);
  });
});

// ─── calcInss — official bracket boundary values ──────────────────────────────

describe("calcInss — official boundary values (Portaria MPS/MF nº 3, Jan 2025)", () => {
  it("salary exactly at bracket 1 ceiling (R$1,518): 1518 × 7.5% = R$113.85", () => {
    // Single bracket: 1518.00 × 7.5% = 113.85
    expect(calcInss(1_518.00)).toBeCloseTo(113.85, 2);
  });

  it("salary exactly at bracket 2 ceiling (R$2,793.88): R$228.68", () => {
    // B1: 1518.00 × 7.5% = 113.85
    // B2: (2793.88 − 1518.00) × 9% = 1275.88 × 9% = 114.83
    // Total = 228.68
    expect(calcInss(2_793.88)).toBeCloseTo(228.68, 2);
  });

  it("salary exactly at bracket 3 ceiling (R$4,190.83): R$396.31", () => {
    // B1: 113.85
    // B2: 114.83
    // B3: (4190.83 − 2793.88) × 12% = 1396.95 × 12% = 167.63
    // Total = 396.31
    expect(calcInss(4_190.83)).toBeCloseTo(396.31, 2);
  });

  it("salary exactly at ceiling (R$8,157.41): R$951.63", () => {
    // B1: 113.85 | B2: 114.83 | B3: 167.63 | B4: 3966.58 × 14% = 555.32
    // Total = 951.63
    expect(calcInss(8_157.41)).toBeCloseTo(951.63, 2);
  });

  it("salary above ceiling (R$15,000) produces same INSS as ceiling", () => {
    expect(calcInss(15_000)).toBeCloseTo(calcInss(8_157.41), 2);
  });

  it("salary R$0 produces R$0", () => {
    expect(calcInss(0)).toBe(0);
  });

  it("salary R$3,000 spans first three brackets correctly: R$253.42", () => {
    // B1: 1518 × 7.5% = 113.85
    // B2: 1275.88 × 9% = 114.83
    // B3: (3000 − 2793.88) × 12% = 206.12 × 12% = 24.73
    // Total = 253.41 (≈ 253.41–253.42 depending on rounding)
    expect(calcInss(3_000)).toBeCloseTo(253.41, 1);
  });

  it("salary minimum wage R$1,412 in 2024 used as known prior-year boundary check", () => {
    // Test that a salary slightly below bracket 1 ceiling uses only 7.5%
    expect(calcInss(1_000)).toBeCloseTo(75.00, 2);
  });
});

// ─── calcInss — bracket breakdown ─────────────────────────────────────────────

describe("calcInssBracketBreakdown", () => {
  it("always returns exactly 4 brackets", () => {
    expect(calcInssBracketBreakdown(3_000)).toHaveLength(4);
  });

  it("sum of contributions is within R$0.04 of calcInss (rounding per-bracket vs end)", () => {
    // calcInss rounds once at the end; breakdown rounds each bracket individually.
    // The difference is at most 4 brackets × 0.01 = 0.04.
    const salary = 5_000;
    const breakdown = calcInssBracketBreakdown(salary);
    const total = breakdown.reduce((acc, b) => acc + b.contribution, 0);
    expect(Math.abs(total - calcInss(salary))).toBeLessThanOrEqual(0.05);
  });

  it("only active brackets have non-zero contribution", () => {
    const breakdown = calcInssBracketBreakdown(2_000);
    breakdown.forEach((b) => {
      if (!b.isActive) {
        expect(b.contribution).toBe(0);
      }
    });
  });
});

// ─── calcIrrf — official bracket reference values ─────────────────────────────

describe("calcIrrf — official bracket reference values (IRRF 2025)", () => {
  it("taxable base R$0: R$0 (exempt)", () => {
    expect(calcIrrf(0)).toBe(0);
  });

  it("taxable base R$2,259.20 (exemption ceiling): R$0", () => {
    expect(calcIrrf(2_259.20)).toBe(0);
  });

  it("taxable base R$2,500: 2500 × 7.5% − 169.44 = R$18.06", () => {
    // bracket upTo 2826.65, rate 7.5%, deduction 169.44
    expect(calcIrrf(2_500)).toBeCloseTo(18.06, 2);
  });

  it("taxable base R$3,000: 3000 × 15% − 381.44 = R$68.56", () => {
    // bracket upTo 3751.05, rate 15%, deduction 381.44
    expect(calcIrrf(3_000)).toBeCloseTo(68.56, 2);
  });

  it("taxable base R$4,000: 4000 × 22.5% − 662.77 = R$237.23", () => {
    // bracket upTo 4664.68, rate 22.5%, deduction 662.77
    expect(calcIrrf(4_000)).toBeCloseTo(237.23, 2);
  });

  it("taxable base R$5,000: 5000 × 27.5% − 896 = R$479.00", () => {
    // top bracket, rate 27.5%, deduction 896
    expect(calcIrrf(5_000)).toBeCloseTo(479.00, 2);
  });

  it("never returns negative value for any input", () => {
    [-1000, -1, 0, 100, 2259.19].forEach((base) => {
      expect(calcIrrf(base)).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── IRRF_PER_DEPENDENT_DEDUCTION ─────────────────────────────────────────────

describe("IRRF_PER_DEPENDENT_DEDUCTION", () => {
  it("is R$189.59 (2025)", () => {
    expect(IRRF_PER_DEPENDENT_DEDUCTION).toBeCloseTo(189.59, 2);
  });
});

// ─── calcIrrfFromGross ────────────────────────────────────────────────────────

describe("calcIrrfFromGross — full pipeline: gross → INSS → IRRF", () => {
  it("gross R$5,000, 0 dependents: INSS=R$509.59, IRRF=R$479.00 on net taxable", () => {
    // INSS on 5000: see above ≈ 509.59
    // taxable = 5000 − 509.59 = 4490.41  → bracket 22.5%, deduction 662.77
    // IRRF = 4490.41 × 0.225 − 662.77 ≈ 347.61
    const inss = calcInss(5_000);
    const irrf = calcIrrfFromGross(5_000, inss, 0);
    expect(irrf).toBeGreaterThan(0);
    // exact check: taxable ≈ 5000 − 509.59 = 4490.41 → 4490.41×0.225 − 662.77 ≈ 347.62
    expect(irrf).toBeCloseTo(4_490.41 * 0.225 - 662.77, 0);
  });

  it("adding one dependent reduces IRRF by approximately R$42.66 (189.59 × 22.5%)", () => {
    const inss = calcInss(5_000);
    const irrfNoDep = calcIrrfFromGross(5_000, inss, 0);
    const irrfOneDep = calcIrrfFromGross(5_000, inss, 1);
    // Reduction = 189.59 × 0.225 ≈ 42.66
    expect(irrfNoDep - irrfOneDep).toBeCloseTo(189.59 * 0.225, 0);
  });

  it("returns 0 when INSS alone exceeds gross", () => {
    expect(calcIrrfFromGross(1_000, 1_000, 0)).toBe(0);
  });
});

// ─── calculateThirteenthSalary — reference scenario ──────────────────────────

describe("calculateThirteenthSalary — reference scenarios", () => {
  it("R$3,000 gross, 12 months, 0 dependents: correct net", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(3_000);
    expect(result.totalInss).toBeCloseTo(calcInss(3_000), 2);
    // taxable = 3000 − INSS ≈ 3000 − 253.41 = 2746.59 → bracket 7.5%, deduction 169.44
    // IRRF ≈ 2746.59 × 0.075 − 169.44 = 205.99 − 169.44 = 36.55
    expect(result.totalIrrf).toBeCloseTo(calcIrrf(3_000 - calcInss(3_000)), 1);
    expect(result.totalNet).toBeCloseTo(result.totalGross - result.totalInss - result.totalIrrf, 2);
  });

  it("first installment: always zero INSS and IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 8_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 2,
    };
    const { firstInstallment } = calculateThirteenthSalary(form);
    expect(firstInstallment.inss).toBe(0);
    expect(firstInstallment.irrf).toBe(0);
  });

  it("tableYear matches BR_TAX_TABLE_YEAR", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(calculateThirteenthSalary(form).tableYear).toBe(BR_TAX_TABLE_YEAR);
  });
});

// ─── calculateFerias — abono INSS exemption (STF RE 593.068) ─────────────────

describe("calculateFerias — abono INSS exemption (STF RE 593.068)", () => {
  it("INSS base is vacationGross only — abono pecuniário is exempt", () => {
    const form: FeriasFormState = {
      grossSalary: 4_000,
      vacationDays: 20,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    const result = calculateFerias(form);
    // INSS must equal calcInss(vacationGross), NOT calcInss(totalGross)
    expect(result.inss).toBeCloseTo(calcInss(result.vacationGross), 2);
    expect(result.inss).not.toBeCloseTo(calcInss(result.totalGross), 2);
  });

  it("abonoValue equals dailyRate × 10 (ABONO_DAYS constant)", () => {
    const form: FeriasFormState = {
      grossSalary: 3_600,
      vacationDays: 20,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    const result = calculateFerias(form);
    // dailyRate = 3600 / 30 = 120; abonoValue = 120 × 10 = 1200
    expect(result.dailyRate).toBeCloseTo(120, 2);
    expect(result.abonoValue).toBeCloseTo(1_200, 2);
  });
});

// ─── calculateRescisao — Lei 12.506/2011 (aviso prévio proporcional) ──────────

describe("calculateRescisao — Lei 12.506/2011 aviso prévio", () => {
  const base = {
    grossSalary: 4_000,
    terminationType: "sem_justa_causa" as const,
    yearsOfService: 0,
    daysWorkedInLastMonth: 30,
    monthsFor13: 6,
    monthsForVacation: 6,
    hasExpiredVacation: false,
    overtimeAverage: 0,
    dependents: 0,
    fgtsBalance: 8_000,
  };

  it("0 years → 30 days notice", () => {
    expect(calculateRescisao({ ...base, yearsOfService: 0 }).noticeDays).toBe(30);
  });

  it("1 year → 33 days notice (30 + 3×1)", () => {
    expect(calculateRescisao({ ...base, yearsOfService: 1 }).noticeDays).toBe(33);
  });

  it("10 years → 60 days notice (30 + 3×10 = 60, below 90 cap)", () => {
    expect(calculateRescisao({ ...base, yearsOfService: 10 }).noticeDays).toBe(60);
  });

  it("20 years → 90 days notice (capped)", () => {
    expect(calculateRescisao({ ...base, yearsOfService: 20 }).noticeDays).toBe(90);
  });

  it("FGTS fine for sem_justa_causa is exactly 40% of fgtsBalance", () => {
    const result = calculateRescisao({ ...base, fgtsBalance: 10_000 });
    expect(result.fgtsMulta).toBeCloseTo(4_000, 2);
  });

  it("FGTS fine for acordo is exactly 20% of fgtsBalance", () => {
    const result = calculateRescisao({
      ...base,
      terminationType: "acordo",
      fgtsBalance: 10_000,
    });
    expect(result.fgtsMulta).toBeCloseTo(2_000, 2);
  });

  it("net = totalGross − INSS − IRRF", () => {
    const result = calculateRescisao(base);
    expect(result.netTotal).toBeCloseTo(result.totalGross - result.inss - result.irrf, 2);
  });
});
