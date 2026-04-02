import { describe, expect, it } from "vitest";
import {
  JUROS_COMPOSTOS_PERIOD_UNITS,
  calculateJurosCompostos,
  createDefaultJurosCompostosFormState,
  validateJurosCompostosForm,
  type JurosCompostosFormState,
} from "./juros-compostos";

// ─── validateJurosCompostosForm ───────────────────────────────────────────────

describe("validateJurosCompostosForm", () => {
  it("returns no errors for a valid form with initial capital", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 5,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    expect(validateJurosCompostosForm(form)).toHaveLength(0);
  });

  it("returns no errors when only monthly contribution is provided (no capital)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: null,
      monthlyContribution: 500,
      nominalRatePct: 10,
      period: 24,
      periodUnit: "months",
      inflationPct: 4.5,
    };
    expect(validateJurosCompostosForm(form)).toHaveLength(0);
  });

  it("returns error when both initialCapital is null/zero and monthlyContribution is 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: null,
      monthlyContribution: 0,
      nominalRatePct: 10,
      period: 5,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const errors = validateJurosCompostosForm(form);
    expect(errors.some((e) => e.field === "initialCapital")).toBe(true);
  });

  it("returns error when nominalRatePct is null", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: null,
      period: 3,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const errors = validateJurosCompostosForm(form);
    expect(errors.some((e) => e.field === "nominalRatePct")).toBe(true);
  });

  it("returns error when nominalRatePct is zero or negative", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 0,
      period: 3,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const errors = validateJurosCompostosForm(form);
    expect(errors.some((e) => e.field === "nominalRatePct")).toBe(true);
  });

  it("returns error when period is null", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: null,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const errors = validateJurosCompostosForm(form);
    expect(errors.some((e) => e.field === "period")).toBe(true);
  });

  it("returns error when period is less than 1", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 0,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const errors = validateJurosCompostosForm(form);
    expect(errors.some((e) => e.field === "period")).toBe(true);
  });
});

// ─── calculateJurosCompostos — basic calculations ─────────────────────────────

describe("calculateJurosCompostos — basic calculations", () => {
  it("grows initial capital with compound interest over 12 months", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 1,
      periodUnit: "years",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    // 10000 * (1.12) = 11200; compound monthly slightly above linear
    expect(result.finalAmountNominal).toBeGreaterThan(11000);
    expect(result.finalAmountNominal).toBeLessThan(11300);
  });

  it("accumulates contributions correctly over 12 months at 0% rate", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 0,
      monthlyContribution: 100,
      nominalRatePct: 0.001,
      period: 12,
      periodUnit: "months",
      inflationPct: 0,
    };
    const result = calculateJurosCompostos(form);
    // ~1200 in contributions, negligible interest
    expect(result.finalAmountNominal).toBeGreaterThan(1200);
    expect(result.totalContributed).toBeCloseTo(1200, 0);
  });

  it("produces a chart with the correct number of data points (years)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 10,
      period: 2,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.chartData).toHaveLength(24);
  });

  it("produces a chart with the correct number of data points (months)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 10,
      period: 6,
      periodUnit: "months",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.chartData).toHaveLength(6);
  });

  it("totalInterest equals finalAmountNominal minus totalContributed", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10000,
      monthlyContribution: 200,
      nominalRatePct: 12,
      period: 3,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.totalInterest).toBeCloseTo(
      result.finalAmountNominal - result.totalContributed,
      1,
    );
  });

  it("finalAmountReal is less than finalAmountNominal when inflation > 0", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10000,
      monthlyContribution: 0,
      nominalRatePct: 12,
      period: 5,
      periodUnit: "years",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    expect(result.finalAmountReal).toBeLessThan(result.finalAmountNominal);
  });

  it("realRatePct is less than nominalRatePct when inflation > 0 (Fisher formula)", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 10000,
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

  it("chart data months are sequential starting from 1", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 5000,
      monthlyContribution: 0,
      nominalRatePct: 8,
      period: 3,
      periodUnit: "months",
      inflationPct: 4.5,
    };
    const result = calculateJurosCompostos(form);
    result.chartData.forEach((point, idx) => {
      expect(point.month).toBe(idx + 1);
    });
  });

  it("nominalAmount is always >= contributed in chart data", () => {
    const form: JurosCompostosFormState = {
      initialCapital: 1000,
      monthlyContribution: 100,
      nominalRatePct: 10,
      period: 12,
      periodUnit: "months",
      inflationPct: 3,
    };
    const result = calculateJurosCompostos(form);
    result.chartData.forEach((point) => {
      expect(point.nominalAmount).toBeGreaterThanOrEqual(point.contributed);
    });
  });
});

// ─── JUROS_COMPOSTOS_PERIOD_UNITS constant ────────────────────────────────────

describe("JUROS_COMPOSTOS_PERIOD_UNITS", () => {
  it("contains months and years", () => {
    expect(JUROS_COMPOSTOS_PERIOD_UNITS).toContain("months");
    expect(JUROS_COMPOSTOS_PERIOD_UNITS).toContain("years");
  });
});

// ─── createDefaultJurosCompostosFormState ─────────────────────────────────────

describe("createDefaultJurosCompostosFormState", () => {
  it("returns defaults: no capital, 0 contribution, years unit, 4.5% inflation", () => {
    const form = createDefaultJurosCompostosFormState();
    expect(form.initialCapital).toBeNull();
    expect(form.monthlyContribution).toBe(0);
    expect(form.nominalRatePct).toBeNull();
    expect(form.period).toBeNull();
    expect(form.periodUnit).toBe("years");
    expect(form.inflationPct).toBe(4.5);
  });
});
