import { describe, expect, it } from "vitest";

import {
  CUSTO_VIDA_REGIONAL_PUBLIC_PATH,
  EXPENSE_CATEGORY_KEYS,
  calculateRegionalCost,
  createDefaultRegionalCostFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  validateRegionalCostForm,
  type RegionalCostFormState,
} from "./custo-de-vida-regional";

/**
 * Builds a valid form state with sensible defaults for tests.
 *
 * @param overrides Partial overrides merged onto the baseline.
 * @returns A complete form state.
 */
function makeForm(overrides: Partial<RegionalCostFormState> = {}): RegionalCostFormState {
  return {
    uf: "SP",
    monthlyIncome: 10000,
    housing: 2500,
    transport: 800,
    food: 1500,
    leisure: 700,
    other: 500,
    ...overrides,
  };
}

describe("custo-de-vida-regional model", () => {
  it("exposes the public path", () => {
    expect(CUSTO_VIDA_REGIONAL_PUBLIC_PATH).toBe("/tools/custo-de-vida-regional");
  });

  it("creates a default form state with a valid UF and zeroed expenses", () => {
    const form = createDefaultRegionalCostFormState();
    expect(form.uf).toHaveLength(2);
    expect(form.monthlyIncome).toBe(0);
    for (const key of EXPENSE_CATEGORY_KEYS) {
      expect(form[key]).toBe(0);
    }
  });

  describe("validation", () => {
    it("requires a positive income", () => {
      const errors = validateRegionalCostForm(makeForm({ monthlyIncome: 0 }));
      expect(errors.some((e) => e.field === "monthlyIncome")).toBe(true);
    });

    it("requires at least one expense", () => {
      const errors = validateRegionalCostForm(
        makeForm({ housing: 0, transport: 0, food: 0, leisure: 0, other: 0 }),
      );
      expect(errors.some((e) => e.field === "expenses")).toBe(true);
    });

    it("rejects an unknown UF", () => {
      const errors = validateRegionalCostForm(makeForm({ uf: "ZZ" }));
      expect(errors.some((e) => e.field === "uf")).toBe(true);
    });

    it("accepts a valid form", () => {
      expect(validateRegionalCostForm(makeForm())).toHaveLength(0);
    });
  });

  describe("calculateRegionalCost", () => {
    it("sums the monthly cost across categories", () => {
      const result = calculateRegionalCost(makeForm());
      expect(result.totalMonthlyCost).toBe(6000);
      expect(result.totalAnnualCost).toBe(72000);
    });

    it("computes committed percentage of income", () => {
      const result = calculateRegionalCost(makeForm({ monthlyIncome: 10000 }));
      expect(result.committedPct).toBe(60);
      expect(result.savingsRatePct).toBe(40);
      expect(result.monthlySavings).toBe(4000);
    });

    it("returns a per-category breakdown summing to the total", () => {
      const result = calculateRegionalCost(makeForm());
      const sum = result.categories.reduce((s, c) => s + c.amount, 0);
      expect(sum).toBe(result.totalMonthlyCost);
      const housing = result.categories.find((c) => c.key === "housing");
      expect(housing?.pctOfIncome).toBe(25);
    });

    it("computes years to retirement via the 4% rule when saving", () => {
      const result = calculateRegionalCost(makeForm());
      // target wealth = annual cost (72000) * 25 = 1,800,000
      expect(result.targetWealth).toBe(1800000);
      expect(result.yearsToRetirement).not.toBeNull();
      expect(result.yearsToRetirement as number).toBeGreaterThan(0);
    });

    it("returns null years to retirement when there are no savings", () => {
      const result = calculateRegionalCost(
        makeForm({ monthlyIncome: 6000 }), // income equals total cost → zero savings
      );
      expect(result.monthlySavings).toBe(0);
      expect(result.yearsToRetirement).toBeNull();
    });

    it("includes a regional comparison from the dataset", () => {
      const result = calculateRegionalCost(makeForm());
      expect(result.regional.uf).toBe("SP");
      expect(result.regional.avgIncome).toBeGreaterThan(0);
      expect(result.regional.avgCost).toBeGreaterThan(0);
      expect(typeof result.regional.costVsRegionalPct).toBe("number");
    });

    it("produces a sustainability score between 0 and 100", () => {
      const result = calculateRegionalCost(makeForm());
      expect(result.sustainabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.sustainabilityScore).toBeLessThanOrEqual(100);
    });

    it("scores a heavy spender lower than a frugal saver", () => {
      const frugal = calculateRegionalCost(makeForm({ monthlyIncome: 10000, housing: 1000, transport: 200, food: 600, leisure: 200, other: 0 }));
      const heavy = calculateRegionalCost(makeForm({ monthlyIncome: 10000, housing: 4000, transport: 1500, food: 2500, leisure: 1500, other: 400 }));
      expect(frugal.sustainabilityScore).toBeGreaterThan(heavy.sustainabilityScore);
    });
  });

  describe("URL sharing round-trip", () => {
    it("encodes and decodes a form state", () => {
      const form = makeForm({ uf: "RJ", monthlyIncome: 8000, leisure: 1200 });
      const decoded = decodeQueryToForm(encodeFormToQuery(form));
      expect(decoded).not.toBeNull();
      expect(decoded?.uf).toBe("RJ");
      expect(decoded?.monthlyIncome).toBe(8000);
      expect(decoded?.leisure).toBe(1200);
    });

    it("returns null for malformed input", () => {
      expect(decodeQueryToForm("not-base64!!!")).toBeNull();
    });
  });
});
