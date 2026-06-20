import { describe, expect, it } from "vitest";

import type { TagDto } from "~/features/tags/contracts/tag.dto";

import type { CreditCardDto, CreditCardUtilization } from "../contracts/credit-card.dto";
import type { EnrichedTransaction } from "../utils/transaction-billing";
import { buildAnalytics } from "./credit-card-analytics";

/**
 * Builds an EnrichedTransaction with defaults for tests.
 *
 * @param partial Fields to override.
 * @returns Complete EnrichedTransaction.
 */
const etx = (partial: Partial<EnrichedTransaction>): EnrichedTransaction => ({
  id: "tx-1",
  title: "Compra",
  amount: 100,
  purchaseDate: "2026-06-02",
  tagId: null,
  creditCardId: "cc-1",
  billMonth: "2026-06",
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  status: "pending",
  ...partial,
});

const TAGS: TagDto[] = [
  { id: "t-food", name: "Alimentação", color: "#11A36B", icon: null },
  { id: "t-transport", name: "Transporte", color: "#2E7CF6", icon: null },
];

const CARDS: CreditCardDto[] = [
  {
    id: "cc-1", name: "Nubank", brand: "mastercard", limit_amount: 5000,
    closing_day: 3, due_day: 10, bank: "Nubank", description: null, benefits: null,
    created_at: null, updated_at: null,
  },
  {
    id: "cc-2", name: "Inter", brand: "mastercard", limit_amount: 3000,
    closing_day: 15, due_day: 22, bank: "Inter", description: null, benefits: null,
    created_at: null, updated_at: null,
  },
];

const TXS: EnrichedTransaction[] = [
  etx({ id: "a", creditCardId: "cc-1", billMonth: "2026-06", tagId: "t-food", amount: 200 }),
  etx({ id: "b", creditCardId: "cc-2", billMonth: "2026-06", tagId: "t-transport", amount: 50 }),
  etx({ id: "c", creditCardId: "cc-1", billMonth: "2026-05", tagId: "t-food", amount: 100 }),
];

describe("buildAnalytics — consolidated", () => {
  const vm = buildAnalytics({ transactions: TXS, tags: TAGS, cards: CARDS, month: "2026-06", cardId: null });

  it("computes the bill total KPI for the month", () => {
    expect(vm.kpis.billTotal).toBe(250);
  });

  it("computes the variation against the previous month", () => {
    // junho 250 vs maio 100 → +150 (+150%).
    expect(vm.kpis.variation).toEqual({ delta: 150, pct: 150 });
  });

  it("flags the top category", () => {
    expect(vm.kpis.topCategory?.name).toBe("Alimentação");
    expect(vm.kpis.topCategory?.total).toBe(200);
  });

  it("computes consolidated limit usage", () => {
    expect(vm.kpis.limitUsedPct).toBeCloseTo((250 / 8000) * 100, 5);
  });

  it("builds a 6-month series per card", () => {
    expect(vm.monthlySeries.months).toHaveLength(6);
    const nubank = vm.monthlySeries.series.find((s) => s.cardId === "cc-1");
    const may = vm.monthlySeries.months.indexOf("2026-05");
    const june = vm.monthlySeries.months.indexOf("2026-06");
    expect(nubank?.values[may]).toBe(100);
    expect(nubank?.values[june]).toBe(200);
  });

  it("breaks down the month by card and lists top transactions", () => {
    expect(vm.cardTotals).toEqual([
      { cardId: "cc-1", name: "Nubank", total: 200 },
      { cardId: "cc-2", name: "Inter", total: 50 },
    ]);
    expect(vm.topTransactions.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("resolves category and card names for the top rows table", () => {
    expect(vm.topRows[0]).toMatchObject({
      id: "a",
      categoryName: "Alimentação",
      categoryColor: "#11A36B",
      cardName: "Nubank",
    });
    expect(vm.topRows[1]).toMatchObject({ id: "b", categoryName: "Transporte", cardName: "Inter" });
  });
});

describe("buildAnalytics — single card uses official utilization", () => {
  const utilization: CreditCardUtilization = {
    cycle: { startDate: "2026-05-04", endDate: "2026-06-03", dueDate: "2026-06-10", status: "open" },
    committedAmount: 200,
    availableAmount: 4800,
    limitAmount: 5000,
    utilizationPct: 73,
  };

  const vm = buildAnalytics({
    transactions: TXS, tags: TAGS, cards: CARDS, month: "2026-06", cardId: "cc-1", utilization,
  });

  it("prefers the official utilization percentage", () => {
    expect(vm.kpis.limitUsedPct).toBe(73);
  });

  it("scopes the monthly series to the selected card", () => {
    expect(vm.monthlySeries.series).toHaveLength(1);
    expect(vm.monthlySeries.series[0]?.cardId).toBe("cc-1");
  });
});
