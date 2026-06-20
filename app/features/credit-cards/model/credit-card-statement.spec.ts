import { describe, expect, it } from "vitest";

import type { TagDto } from "~/features/tags/contracts/tag.dto";

import type { CreditCardBill, CreditCardDto, CreditCardUtilization } from "../contracts/credit-card.dto";
import type { EnrichedTransaction } from "../utils/transaction-billing";
import { buildStatement } from "./credit-card-statement";

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
  etx({ id: "a", creditCardId: "cc-1", billMonth: "2026-06", tagId: "t-food", amount: 100 }),
  etx({ id: "b", creditCardId: "cc-2", billMonth: "2026-06", tagId: "t-transport", amount: 50 }),
  etx({ id: "c", creditCardId: "cc-1", billMonth: "2026-05", tagId: "t-food", amount: 30 }),
];

describe("buildStatement — consolidated (all cards)", () => {
  const vm = buildStatement({ transactions: TXS, tags: TAGS, cards: CARDS, month: "2026-06", cardId: null });

  it("sums the month total across cards", () => {
    expect(vm.total).toBe(150);
    expect(vm.itemCount).toBe(2);
  });

  it("has no per-card status and uses the nearest due date", () => {
    expect(vm.status).toBeNull();
    expect(vm.dueDate).toBe("2026-06-10");
  });

  it("groups categories sorted by total", () => {
    expect(vm.categories.map((c) => [c.name, c.total])).toEqual([
      ["Alimentação", 100],
      ["Transporte", 50],
    ]);
  });

  it("builds a 6-month trend marking the current month", () => {
    expect(vm.monthlyTrend).toHaveLength(6);
    const current = vm.monthlyTrend.find((p) => p.current);
    expect(current?.month).toBe("2026-06");
    expect(current?.total).toBe(150);
    expect(vm.monthlyTrend.find((p) => p.month === "2026-05")?.total).toBe(30);
  });

  it("derives consolidated utilization from summed limits", () => {
    expect(vm.limitAmount).toBe(8000);
    expect(vm.utilizationPct).toBeCloseTo((150 / 8000) * 100, 5);
  });

  it("exposes per-card rail totals and the all-cards total", () => {
    expect(vm.allCardsTotal).toBe(150);
    expect(vm.railTotals).toEqual([
      { cardId: "cc-1", name: "Nubank", total: 100 },
      { cardId: "cc-2", name: "Inter", total: 50 },
    ]);
  });
});

describe("buildStatement — single card with official bill", () => {
  const bill: CreditCardBill = {
    cycle: { startDate: "2026-05-04", endDate: "2026-06-03", dueDate: "2026-06-10", status: "closed" },
    transactions: [
      { id: "x", title: "A", amount: 600, dueDate: "2026-05-20", status: "paid", type: "expense", impactPolicy: "full" },
      { id: "y", title: "B", amount: 399, dueDate: "2026-05-22", status: "pending", type: "expense", impactPolicy: "full" },
    ],
    totalAmount: 999,
    paidAmount: 600,
    pendingAmount: 399,
  };
  const utilization: CreditCardUtilization = {
    cycle: bill.cycle,
    committedAmount: 999,
    availableAmount: 4001,
    limitAmount: 5000,
    utilizationPct: 42,
  };

  const vm = buildStatement({
    transactions: TXS, tags: TAGS, cards: CARDS, month: "2026-06", cardId: "cc-1", bill, utilization,
  });

  it("prefers the official bill total and item count", () => {
    expect(vm.total).toBe(999);
    expect(vm.itemCount).toBe(2);
  });

  it("uses the official cycle status and due date", () => {
    expect(vm.status).toEqual({ label: "Fechada", tone: "closed" });
    expect(vm.dueDate).toBe("2026-06-10");
  });

  it("uses the official utilization and card limit", () => {
    expect(vm.utilizationPct).toBe(42);
    expect(vm.limitAmount).toBe(5000);
  });

  it("still groups categories from real transactions (bill lacks category)", () => {
    expect(vm.categories.map((c) => c.name)).toEqual(["Alimentação"]);
  });
});

describe("buildStatement — single card without bill (derived cycle)", () => {
  const vm = buildStatement({ transactions: TXS, tags: TAGS, cards: CARDS, month: "2026-06", cardId: "cc-1" });

  it("derives the due date from the card cycle", () => {
    expect(vm.dueDate).toBe("2026-06-10");
    expect(vm.total).toBe(100);
  });
});
