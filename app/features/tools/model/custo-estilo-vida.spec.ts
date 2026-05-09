import { describe, expect, it } from "vitest";

import {
  calculateCustoEstiloVida,
  calculateEquivalences,
  calculateOpportunityCost,
  createDefaultCustoEstiloVidaFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  validateCustoEstiloVidaForm,
  type CustoEstiloVidaFormState,
} from "./custo-estilo-vida";

describe("validateCustoEstiloVidaForm", () => {
  it("returns error when no expense has amount", () => {
    const form = createDefaultCustoEstiloVidaFormState();
    const errors = validateCustoEstiloVidaForm(form);
    expect(errors.some((e) => e.messageKey === "errors.atLeastOneExpenseRequired")).toBe(true);
  });

  it("returns error when horizon < 1", () => {
    const form: CustoEstiloVidaFormState = {
      ...createDefaultCustoEstiloVidaFormState(),
      expenses: [{ name: "Café", monthlyAmount: 200 }],
      horizonYears: 0,
    };
    const errors = validateCustoEstiloVidaForm(form);
    expect(errors.some((e) => e.messageKey === "errors.horizonRequired")).toBe(true);
  });

  it("passes with valid form", () => {
    const form: CustoEstiloVidaFormState = {
      ...createDefaultCustoEstiloVidaFormState(),
      expenses: [{ name: "Café", monthlyAmount: 200 }],
    };
    expect(validateCustoEstiloVidaForm(form)).toHaveLength(0);
  });
});

describe("calculateCustoEstiloVida", () => {
  it("calculates opportunity cost for single expense", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Streaming", monthlyAmount: 50 }],
      annualReturnPct: 12,
      horizonYears: 10,
    };
    const result = calculateCustoEstiloVida(form);

    expect(result.totalMonthlyCost).toBe(50);
    expect(result.totalAnnualCost).toBe(600);
    expect(result.totalOpportunityCost).toBeGreaterThan(600 * 10);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0]!.opportunityCost).toBeGreaterThan(0);
  });

  it("calculates multiple expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Streaming", monthlyAmount: 50 },
        { name: "Café diário", monthlyAmount: 200 },
      ],
      annualReturnPct: 10,
      horizonYears: 20,
    };
    const result = calculateCustoEstiloVida(form);

    expect(result.totalMonthlyCost).toBe(250);
    expect(result.expenses).toHaveLength(2);
    expect(result.totalOpportunityCost).toBe(
      result.expenses[0]!.opportunityCost + result.expenses[1]!.opportunityCost,
    );
  });

  it("filters out zero-amount expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Streaming", monthlyAmount: 50 },
        { name: "Vazio", monthlyAmount: 0 },
      ],
      annualReturnPct: 12,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.expenses).toHaveLength(1);
  });

  it("uses 'Sem nome' for unnamed expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "", monthlyAmount: 100 }],
      annualReturnPct: 12,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.expenses[0]!.name).toBe("Sem nome");
  });

  it("handles 0% return rate", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Test", monthlyAmount: 100 }],
      annualReturnPct: 0,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.totalOpportunityCost).toBe(6000); // 100 * 60 months, no growth
  });

  it("includes investedValue and realReturn per expense", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Café", monthlyAmount: 15 }],
      annualReturnPct: 12,
      horizonYears: 20,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.expenses[0]!.investedValue).toBeGreaterThan(0);
    expect(result.expenses[0]!.realReturn).toBeGreaterThan(0);
    // Real return must be less than nominal (inflation deflates)
    expect(result.expenses[0]!.realReturn).toBeLessThan(result.expenses[0]!.investedValue);
  });

  it("includes equivalences when invested value is large", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Café", monthlyAmount: 500 }],
      annualReturnPct: 12,
      horizonYears: 30,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.equivalences.length).toBeGreaterThan(0);
  });

  it("30-year horizon at 12% compounds significantly", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Café", monthlyAmount: 15 }],
      annualReturnPct: 12,
      horizonYears: 30,
    };
    const result = calculateCustoEstiloVida(form);
    const directCost = 15 * 12 * 30; // 5400
    expect(result.totalOpportunityCost).toBeGreaterThan(directCost * 5);
  });

  it("5-year horizon at 6% produces smaller return than 20-year at 12%", () => {
    /**
     * @param horizon
     * @param rate
     * @returns Form state with a single expense.
     */
    const mkForm = (horizon: number, rate: number): CustoEstiloVidaFormState => ({
      expenses: [{ name: "X", monthlyAmount: 100 }],
      annualReturnPct: rate,
      horizonYears: horizon,
    });
    const short = calculateCustoEstiloVida(mkForm(5, 6));
    const long = calculateCustoEstiloVida(mkForm(20, 12));
    expect(long.totalOpportunityCost).toBeGreaterThan(short.totalOpportunityCost);
  });
});

describe("URL sharing encode/decode", () => {
  it("roundtrips form state through encode/decode", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Café", monthlyAmount: 200 },
        { name: "Gym", monthlyAmount: 150 },
      ],
      annualReturnPct: 12,
      horizonYears: 10,
    };
    const encoded = encodeFormToQuery(form);
    const decoded = decodeQueryToForm(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.expenses).toHaveLength(2);
    expect(decoded!.expenses![0]!.name).toBe("Café");
    expect(decoded!.expenses![0]!.monthlyAmount).toBe(200);
    expect(decoded!.annualReturnPct).toBe(12);
    expect(decoded!.horizonYears).toBe(10);
  });

  it("returns null for invalid encoded string", () => {
    expect(decodeQueryToForm("not-valid-base64!!!")).toBeNull();
  });

  it("returns null when decoded data has no expenses array", () => {
    const encoded = btoa(JSON.stringify({ r: 12, h: 10 }));
    expect(decodeQueryToForm(encoded)).toBeNull();
  });

  it("filters out zero-amount expenses in encoding", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Active", monthlyAmount: 100 },
        { name: "Empty", monthlyAmount: 0 },
      ],
      annualReturnPct: 10,
      horizonYears: 5,
    };
    const encoded = encodeFormToQuery(form);
    const decoded = decodeQueryToForm(encoded);
    expect(decoded!.expenses).toHaveLength(1);
  });
});

// ─── calculateOpportunityCost ─────────────────────────────────────────────────

describe("calculateOpportunityCost", () => {
  it("returns directCost = monthlyAmount * months", () => {
    const result = calculateOpportunityCost({ name: "Café", monthlyAmount: 15 }, { horizon: 20, rate: 12 });
    expect(result.directCost).toBe(15 * 240); // 3600
  });

  it("investedValue > directCost when rate > 0", () => {
    const result = calculateOpportunityCost({ name: "X", monthlyAmount: 100 }, { horizon: 10, rate: 12 });
    expect(result.investedValue).toBeGreaterThan(result.directCost);
  });

  it("investedValue === directCost when rate = 0", () => {
    const result = calculateOpportunityCost({ name: "X", monthlyAmount: 100 }, { horizon: 10, rate: 0 });
    expect(result.investedValue).toBe(result.directCost);
  });

  it("realReturn is less than investedValue due to inflation", () => {
    const result = calculateOpportunityCost({ name: "X", monthlyAmount: 100 }, { horizon: 20, rate: 12, ipcaPct: 4 });
    expect(result.realReturn).toBeLessThan(result.investedValue);
  });

  it("custom ipcaPct 0 means realReturn equals investedValue", () => {
    const result = calculateOpportunityCost({ name: "X", monthlyAmount: 100 }, { horizon: 10, rate: 12, ipcaPct: 0 });
    expect(result.realReturn).toBe(result.investedValue);
  });
});

// ─── calculateEquivalences ────────────────────────────────────────────────────

describe("calculateEquivalences", () => {
  it("returns non-empty list for large value", () => {
    expect(calculateEquivalences(100000).length).toBeGreaterThan(0);
  });

  it("returns empty list for very small value", () => {
    expect(calculateEquivalences(1).length).toBe(0);
  });

  it("cafezinhos quantity matches floor(value/6)", () => {
    const items = calculateEquivalences(60);
    const cafe = items.find((i) => i.label.includes("cafezinho"));
    expect(cafe?.quantity).toBe(10);
  });

  it("viagens quantity matches floor(value/8000)", () => {
    const items = calculateEquivalences(24000);
    const travel = items.find((i) => i.label.includes("viagens"));
    expect(travel?.quantity).toBe(3);
  });
});
