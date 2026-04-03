/**
 * WEB36 — Tier 3: Utility financial calculation reference values.
 *
 * Tests calculation correctness for general-purpose utility tools:
 * - Discount / Markup / Margin arithmetic
 * - Bill splitting (equal and individual modes)
 * - FGTS deposit and termination fine calculation
 *
 * Import path uses utils/calculations (public API barrel) to validate WEB35.
 */

import { describe, expect, it } from "vitest";
import {
  calculateDescontoMarkup,
  calculateDividirConta,
  type DescontoMarkupFormState,
  type DividirContaFormState,
} from "~/utils/calculations/utility";
import {
  calculateFgts,
  FGTS_FINE_RATES,
  type FgtsFormState,
} from "~/utils/calculations/fgts";

// ─── Discount arithmetic ──────────────────────────────────────────────────────

describe("calculateDescontoMarkup — desconto arithmetic", () => {
  it("R$200 with 25% discount = R$150 final, R$50 saved", () => {
    const form: DescontoMarkupFormState = { mode: "desconto", price: 200, pct: 25, cost: null };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(150, 2);
    expect(result.savingsOrProfit).toBeCloseTo(50, 2);
  });

  it("R$100 with 0% discount = R$100 final, R$0 saved", () => {
    const form: DescontoMarkupFormState = { mode: "desconto", price: 100, pct: 0, cost: null };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(100, 2);
    expect(result.savingsOrProfit).toBe(0);
  });

  it("R$100 with 100% discount = R$0 final", () => {
    const form: DescontoMarkupFormState = { mode: "desconto", price: 100, pct: 100, cost: null };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBe(0);
  });
});

// ─── Markup arithmetic ────────────────────────────────────────────────────────

describe("calculateDescontoMarkup — markup arithmetic", () => {
  it("cost=R$80, markup=50%: sale price=R$120, profit=R$40", () => {
    const form: DescontoMarkupFormState = { mode: "markup", price: null, pct: 50, cost: 80 };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(120, 2);
    expect(result.savingsOrProfit).toBeCloseTo(40, 2);
  });

  it("markup 0% returns same as cost, profit = 0", () => {
    const form: DescontoMarkupFormState = { mode: "markup", price: null, pct: 0, cost: 100 };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(100, 2);
    expect(result.savingsOrProfit).toBe(0);
  });
});

// ─── Margin arithmetic ────────────────────────────────────────────────────────

describe("calculateDescontoMarkup — margem arithmetic", () => {
  it("price=R$120, cost=R$90: margin=25%, profit=R$30", () => {
    // margin = (120−90)/120 × 100 = 25%
    const form: DescontoMarkupFormState = { mode: "margem", price: 120, pct: null, cost: 90 };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(25, 2);
    expect(result.savingsOrProfit).toBeCloseTo(30, 2);
  });

  it("price equals cost → margin=0%, profit=0", () => {
    const form: DescontoMarkupFormState = { mode: "margem", price: 100, pct: null, cost: 100 };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBe(0);
    expect(result.savingsOrProfit).toBe(0);
  });

  it("margin is always < 100% when cost > 0", () => {
    const form: DescontoMarkupFormState = { mode: "margem", price: 150, pct: null, cost: 1 };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeLessThan(100);
  });
});

// ─── Reverse discount arithmetic ─────────────────────────────────────────────

describe("calculateDescontoMarkup — reverso arithmetic", () => {
  it("final price=R$75, discount=25%: original=R$100, savings=R$25", () => {
    // original = 75 / (1 − 0.25) = 75 / 0.75 = 100
    const form: DescontoMarkupFormState = { mode: "reverso", price: 75, pct: 25, cost: null };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBeCloseTo(100, 2);
    expect(result.savingsOrProfit).toBeCloseTo(25, 2);
  });

  it("reverso is the inverse of desconto (round-trip)", () => {
    const original = 200;
    const discountPct = 30;
    // Step 1: apply discount
    const discounted = calculateDescontoMarkup({
      mode: "desconto",
      price: original,
      pct: discountPct,
      cost: null,
    });
    // Step 2: recover original from discounted price
    const recovered = calculateDescontoMarkup({
      mode: "reverso",
      price: discounted.calculatedValue,
      pct: discountPct,
      cost: null,
    });
    expect(recovered.calculatedValue).toBeCloseTo(original, 1);
  });
});

// ─── Bill splitting — equal mode ─────────────────────────────────────────────

describe("calculateDividirConta — equal split", () => {
  it("R$120 bill, 4 people, 0% service fee: R$30/person", () => {
    const form: DividirContaFormState = {
      mode: "equal",
      total: 120,
      serviceFeePct: 0,
      tipPct: 0,
      people: 4,
      individualAmounts: [],
    };
    const result = calculateDividirConta(form);
    expect(result.perPersonEqual).toBeCloseTo(30, 2);
  });

  it("R$100 bill, 3 people, 10% service fee: totalWithFees=R$110, R$36.67/person", () => {
    const form: DividirContaFormState = {
      mode: "equal",
      total: 100,
      serviceFeePct: 10,
      tipPct: 0,
      people: 3,
      individualAmounts: [],
    };
    const result = calculateDividirConta(form);
    expect(result.totalWithFees).toBeCloseTo(110, 2);
    expect(result.perPersonEqual).toBeCloseTo(110 / 3, 1);
  });

  it("tip is added to totalWithFees", () => {
    const form: DividirContaFormState = {
      mode: "equal",
      total: 100,
      serviceFeePct: 0,
      tipPct: 15,
      people: 2,
      individualAmounts: [],
    };
    const result = calculateDividirConta(form);
    expect(result.totalWithFees).toBeCloseTo(115, 2);
  });
});

// ─── Bill splitting — individual (proportional) mode ─────────────────────────

describe("calculateDividirConta — individual (proportional) split", () => {
  it("person who consumed more pays more", () => {
    const form: DividirContaFormState = {
      mode: "individual",
      total: 150,
      serviceFeePct: 0,
      tipPct: 0,
      people: 2,
      individualAmounts: [100, 50],
    };
    const result = calculateDividirConta(form);
    expect(result.perPersonIndividual[0]).toBeGreaterThan(result.perPersonIndividual[1]!);
  });

  it("proportional amounts sum to consumption total + proportional fees", () => {
    // In individual mode: each person pays their consumption + fee share.
    // totalWithFees is still based on `total` (pre-fee amount).
    // Sum of perPersonIndividual = sum of consumptions + total fees.
    const consumptions = [80, 60, 10];
    const consumptionSum = 150;
    const feePct = 10;
    const form: DividirContaFormState = {
      mode: "individual",
      total: consumptionSum,
      serviceFeePct: feePct,
      tipPct: 0,
      people: 3,
      individualAmounts: consumptions,
    };
    const result = calculateDividirConta(form);
    const sum = result.perPersonIndividual.reduce((acc, p) => acc + p, 0);
    // Each person pays consumption + proportional fee share
    // Total fees = 150 × 10% = 15; total paid = 150 + 15 = 165
    expect(sum).toBeCloseTo(consumptionSum + consumptionSum * (feePct / 100), 1);
  });
});

// ─── FGTS — deposit and fine calculation ─────────────────────────────────────

describe("calculateFgts — deposit rate and termination fines", () => {
  const baseForm: FgtsFormState = {
    grossSalary: 5_000,
    yearsOfService: 1,
    monthsOfService: 0,
    currentBalance: 0,
    trRatePct: 0,
    terminationType: "sem_justa_causa",
  };

  it("monthly deposit is 8% of gross salary (Art. 15 Lei 8.036/1990)", () => {
    const result = calculateFgts(baseForm);
    // Monthly deposit = 5000 × 8% = 400
    expect(result.monthlyDeposit).toBeCloseTo(400, 2);
  });

  it("sem_justa_causa fine rate is 40% (FGTS_FINE_RATES constant)", () => {
    expect(FGTS_FINE_RATES.sem_justa_causa).toBe(0.4);
  });

  it("acordo fine rate is 20% (Lei 13.467/2017)", () => {
    expect(FGTS_FINE_RATES.acordo).toBe(0.2);
  });

  it("pedido_demissao and justa_causa have 0% fine rate", () => {
    expect(FGTS_FINE_RATES.pedido_demissao).toBe(0);
    expect(FGTS_FINE_RATES.justa_causa).toBe(0);
  });

  it("sem_justa_causa: fineAmount = 40% of projectedBalance", () => {
    const result = calculateFgts({ ...baseForm, terminationType: "sem_justa_causa" });
    expect(result.fineAmount).toBeCloseTo(result.projectedBalance * 0.4, 2);
  });

  it("acordo: fineAmount = 20% of projectedBalance", () => {
    const result = calculateFgts({ ...baseForm, terminationType: "acordo" });
    expect(result.fineAmount).toBeCloseTo(result.projectedBalance * 0.2, 2);
  });

  it("pedido_demissao: fineAmount = 0", () => {
    const result = calculateFgts({ ...baseForm, terminationType: "pedido_demissao" });
    expect(result.fineAmount).toBe(0);
  });

  it("justa_causa: fineAmount = 0", () => {
    const result = calculateFgts({ ...baseForm, terminationType: "justa_causa" });
    expect(result.fineAmount).toBe(0);
  });

  it("projectedBalance increases monotonically with more years of service", () => {
    const result1 = calculateFgts({ ...baseForm, yearsOfService: 1 });
    const result5 = calculateFgts({ ...baseForm, yearsOfService: 5 });
    expect(result5.projectedBalance).toBeGreaterThan(result1.projectedBalance);
  });

  it("sem_justa_causa generates governmentFineAmount = 10% of projectedBalance", () => {
    const result = calculateFgts({ ...baseForm, terminationType: "sem_justa_causa" });
    expect(result.governmentFineAmount).toBeCloseTo(result.projectedBalance * 0.1, 2);
  });
});
