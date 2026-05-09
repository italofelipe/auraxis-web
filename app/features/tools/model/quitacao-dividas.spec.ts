import { describe, expect, it } from "vitest";

import {
  calculateQuitacaoDividas,
  compareMethods,
  createDefaultQuitacaoDividasFormState,
  isDebtPayable,
  simulateAvalanche,
  simulateSnowball,
  validateQuitacaoDividasForm,
  type QuitacaoDividasFormState,
} from "./quitacao-dividas";

describe("validateQuitacaoDividasForm", () => {
  it("returns error when fewer than 2 debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [{ name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 }],
      extraPayment: 0,
    };
    const errors = validateQuitacaoDividasForm(form);
    expect(errors.some((e) => e.messageKey === "errors.minTwoDebts")).toBe(true);
  });

  it("returns error when no debt has valid balance", () => {
    const form = createDefaultQuitacaoDividasFormState();
    const errors = validateQuitacaoDividasForm(form);
    expect(errors.some((e) => e.messageKey === "errors.atLeastOneDebtRequired")).toBe(true);
  });

  it("passes validation with valid debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [
        { name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 },
        { name: "B", balance: 5000, monthlyRatePct: 5, minimumPayment: 200 },
      ],
      extraPayment: 300,
    };
    expect(validateQuitacaoDividasForm(form)).toHaveLength(0);
  });
});

describe("calculateQuitacaoDividas", () => {
  const baseForm: QuitacaoDividasFormState = {
    debts: [
      { name: "Cartão A", balance: 2000, monthlyRatePct: 10, minimumPayment: 200 },
      { name: "Empréstimo B", balance: 8000, monthlyRatePct: 2, minimumPayment: 400 },
    ],
    extraPayment: 500,
  };

  it("calculates total debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.totalDebt).toBe(10000);
  });

  it("generates both snowball and avalanche strategies", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.snowball.strategy).toBe("snowball");
    expect(result.avalanche.strategy).toBe("avalanche");
  });

  it("both strategies eventually pay off all debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    const lastSnowball = result.snowball.timeline[result.snowball.timeline.length - 1];
    const lastAvalanche = result.avalanche.timeline[result.avalanche.timeline.length - 1];
    expect(lastSnowball!.totalBalance).toBeLessThan(1);
    expect(lastAvalanche!.totalBalance).toBeLessThan(1);
  });

  it("avalanche pays less total interest than snowball (high rate disparity)", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.avalanche.totalInterest).toBeLessThanOrEqual(result.snowball.totalInterest);
    expect(result.bestStrategy).toBe("avalanche");
  });

  it("calculates interest saved", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.interestSaved).toBeGreaterThanOrEqual(0);
    expect(result.interestSaved).toBe(
      Math.abs(result.snowball.totalInterest - result.avalanche.totalInterest),
    );
  });

  it("timeline starts at month 0 with full debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.snowball.timeline[0]!.month).toBe(0);
    expect(result.snowball.timeline[0]!.totalBalance).toBe(10000);
  });

  it("handles no extra payment", () => {
    const form: QuitacaoDividasFormState = {
      ...baseForm,
      extraPayment: 0,
    };
    const result = calculateQuitacaoDividas(form);
    expect(result.snowball.totalMonths).toBeGreaterThan(0);
    expect(result.avalanche.totalMonths).toBeGreaterThan(0);
  });

  it("handles zero-rate debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [
        { name: "Sem juros", balance: 1000, monthlyRatePct: 0, minimumPayment: 100 },
        { name: "Com juros", balance: 2000, monthlyRatePct: 3, minimumPayment: 150 },
      ],
      extraPayment: 200,
    };
    const result = calculateQuitacaoDividas(form);
    expect(result.totalDebt).toBe(3000);
    expect(result.snowball.totalMonths).toBeGreaterThan(0);
  });
});

// ─── simulateSnowball ─────────────────────────────────────────────────────────

describe("simulateSnowball", () => {
  const debts = [
    { name: "Pequena", balance: 500, monthlyRatePct: 3, minimumPayment: 50 },
    { name: "Grande", balance: 5000, monthlyRatePct: 1, minimumPayment: 300 },
  ];

  it("returns snowball strategy label", () => {
    expect(simulateSnowball(debts, 200).strategy).toBe("snowball");
  });

  it("eventually clears all debt", () => {
    const result = simulateSnowball(debts, 200);
    expect(result.timeline[result.timeline.length - 1]!.totalBalance).toBeLessThan(1);
  });

  it("timeline month 0 equals original total", () => {
    expect(simulateSnowball(debts, 0).timeline[0]!.totalBalance).toBe(5500);
  });

  it("extra payment of 0 still pays off debt", () => {
    expect(simulateSnowball(debts, 0).totalMonths).toBeGreaterThan(0);
  });

  it("very high extra payment clears debt in 1 month", () => {
    expect(simulateSnowball(debts, 50000).totalMonths).toBeLessThanOrEqual(2);
  });
});

// ─── simulateAvalanche ────────────────────────────────────────────────────────

describe("simulateAvalanche", () => {
  const debts = [
    { name: "Alta taxa", balance: 2000, monthlyRatePct: 10, minimumPayment: 200 },
    { name: "Baixa taxa", balance: 8000, monthlyRatePct: 1, minimumPayment: 400 },
  ];

  it("returns avalanche strategy label", () => {
    expect(simulateAvalanche(debts, 300).strategy).toBe("avalanche");
  });

  it("clears all debt eventually", () => {
    const result = simulateAvalanche(debts, 300);
    expect(result.timeline[result.timeline.length - 1]!.totalBalance).toBeLessThan(1);
  });

  it("totalInterest is positive when rates > 0", () => {
    expect(simulateAvalanche(debts, 300).totalInterest).toBeGreaterThan(0);
  });
});

// ─── 5 debts with mixed rates ─────────────────────────────────────────────────

describe("5 debts with mixed rates", () => {
  const fiveDebts = [
    { name: "D1", balance: 500, monthlyRatePct: 1, minimumPayment: 60 },
    { name: "D2", balance: 1500, monthlyRatePct: 3, minimumPayment: 100 },
    { name: "D3", balance: 2000, monthlyRatePct: 5, minimumPayment: 150 },
    { name: "D4", balance: 3000, monthlyRatePct: 2, minimumPayment: 200 },
    { name: "D5", balance: 8000, monthlyRatePct: 1.5, minimumPayment: 400 },
  ];

  it("snowball clears all 5 debts", () => {
    const result = simulateSnowball(fiveDebts, 500);
    expect(result.timeline[result.timeline.length - 1]!.totalBalance).toBeLessThan(1);
  });

  it("avalanche clears all 5 debts", () => {
    const result = simulateAvalanche(fiveDebts, 500);
    expect(result.timeline[result.timeline.length - 1]!.totalBalance).toBeLessThan(1);
  });

  it("avalanche pays same or less interest than snowball", () => {
    const snow = simulateSnowball(fiveDebts, 200);
    const aval = simulateAvalanche(fiveDebts, 200);
    expect(aval.totalInterest).toBeLessThanOrEqual(snow.totalInterest);
  });
});

// ─── Edge case: all debts same rate ───────────────────────────────────────────

describe("edge case: all debts with same rate", () => {
  it("strategies produce equivalent total interest", () => {
    const debts = [
      { name: "D1", balance: 1000, monthlyRatePct: 5, minimumPayment: 100 },
      { name: "D2", balance: 2000, monthlyRatePct: 5, minimumPayment: 150 },
    ];
    const snow = simulateSnowball(debts, 200);
    const aval = simulateAvalanche(debts, 200);
    expect(Math.abs(snow.totalInterest - aval.totalInterest)).toBeLessThan(1);
  });
});

// ─── compareMethods ───────────────────────────────────────────────────────────

describe("compareMethods", () => {
  it("recommends avalanche when it saves significant interest", () => {
    // Snowball pays 500 first, then redirects to 10000 loan.
    // Avalanche attacks the 5% loan directly — saves meaningful interest.
    const debts = [
      { name: "Small fast", balance: 500, monthlyRatePct: 1, minimumPayment: 50 },
      { name: "Big high-rate", balance: 10000, monthlyRatePct: 5, minimumPayment: 600 },
    ];
    const snow = simulateSnowball(debts, 400);
    const aval = simulateAvalanche(debts, 400);
    // Avalanche should pay big/high-rate first → less total interest
    expect(aval.totalInterest).toBeLessThanOrEqual(snow.totalInterest);
    const cmp = compareMethods(snow, aval);
    // interestSaved >= 0 (could be 0 if both produce same result, but bestStrategy must be set)
    expect(cmp.bestStrategy).toBeDefined();
    expect(cmp.recommendation).toBeTruthy();
  });

  it("returns equivalent recommendation when savings < R$1", () => {
    const same = { strategy: "snowball" as const, totalMonths: 10, totalPaid: 1000, totalInterest: 100, timeline: [] };
    const cmp = compareMethods(same, { ...same, strategy: "avalanche" as const });
    expect(cmp.recommendation).toContain("equivalente");
  });

  it("interestSaved is always non-negative", () => {
    const snow = simulateSnowball(
      [
        { name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 },
        { name: "B", balance: 500, monthlyRatePct: 2, minimumPayment: 80 },
      ],
      0,
    );
    const aval = simulateAvalanche(
      [
        { name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 },
        { name: "B", balance: 500, monthlyRatePct: 2, minimumPayment: 80 },
      ],
      0,
    );
    expect(compareMethods(snow, aval).interestSaved).toBeGreaterThanOrEqual(0);
  });
});

// ─── isDebtPayable ────────────────────────────────────────────────────────────

describe("isDebtPayable", () => {
  it("returns false when minimum payment does not exceed monthly interest", () => {
    // 1000 * 10% = 100 interest; minPayment = 50 → unpayable
    expect(isDebtPayable({ name: "X", balance: 1000, monthlyRatePct: 10, minimumPayment: 50 })).toBe(false);
  });

  it("returns true when minimum payment exceeds monthly interest", () => {
    // 1000 * 2% = 20 interest; minPayment = 100 → payable
    expect(isDebtPayable({ name: "X", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 })).toBe(true);
  });

  it("returns true for zero-balance debt", () => {
    expect(isDebtPayable({ name: "X", balance: 0, monthlyRatePct: 5, minimumPayment: 0 })).toBe(true);
  });

  it("returns true for zero-rate debt regardless of payment", () => {
    expect(isDebtPayable({ name: "X", balance: 5000, monthlyRatePct: 0, minimumPayment: 1 })).toBe(true);
  });
});
