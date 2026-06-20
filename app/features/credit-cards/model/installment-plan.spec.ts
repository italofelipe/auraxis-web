import { describe, expect, it } from "vitest";

import { buildDistribution, computeInstallmentPlan } from "./installment-plan";

describe("computeInstallmentPlan", () => {
  it("splits the full amount when there is no down payment", () => {
    expect(computeInstallmentPlan({ total: 1200, downPayment: 0, installments: 3 })).toEqual({
      downPayment: 0,
      financed: 1200,
      perInstallment: 400,
    });
  });

  it("subtracts the down payment before splitting", () => {
    expect(computeInstallmentPlan({ total: 1200, downPayment: 300, installments: 3 })).toEqual({
      downPayment: 300,
      financed: 900,
      perInstallment: 300,
    });
  });

  it("clamps the down payment to the total", () => {
    const plan = computeInstallmentPlan({ total: 500, downPayment: 900, installments: 4 });
    expect(plan.downPayment).toBe(500);
    expect(plan.financed).toBe(0);
  });

  it("treats invalid installment counts as a single bill", () => {
    expect(computeInstallmentPlan({ total: 300, downPayment: 0, installments: 0 }).perInstallment).toBe(300);
  });
});

describe("buildDistribution", () => {
  it("returns a single bill for à vista", () => {
    const chips = buildDistribution({
      mode: "avista", total: 1200, downPayment: 0, hasDownPayment: false, installments: 1, startBillMonth: "2026-06",
    });
    expect(chips).toEqual([{ key: "full", label: "Jun", sub: "à vista", value: 1200, isEntry: false }]);
  });

  it("distributes installments across consecutive bill months", () => {
    const chips = buildDistribution({
      mode: "parcelado", total: 1200, downPayment: 0, hasDownPayment: false, installments: 3, startBillMonth: "2026-06",
    });
    expect(chips.map((chip) => [chip.label, chip.sub, chip.value])).toEqual([
      ["Jun", "1/3", 400],
      ["Jul", "2/3", 400],
      ["Ago", "3/3", 400],
    ]);
  });

  it("prepends an entry chip when a down payment is given", () => {
    const chips = buildDistribution({
      mode: "parcelado", total: 1200, downPayment: 300, hasDownPayment: true, installments: 3, startBillMonth: "2026-06",
    });
    expect(chips[0]).toEqual({ key: "entry", label: "Entrada", sub: "hoje", value: 300, isEntry: true });
    expect(chips).toHaveLength(4);
    expect(chips[1]?.value).toBe(300);
  });

  it("ignores the down payment in à vista mode", () => {
    const chips = buildDistribution({
      mode: "avista", total: 1000, downPayment: 200, hasDownPayment: true, installments: 1, startBillMonth: "2026-06",
    });
    expect(chips).toHaveLength(1);
    expect(chips[0]?.isEntry).toBe(false);
    expect(chips[0]?.value).toBe(1000);
  });
});
