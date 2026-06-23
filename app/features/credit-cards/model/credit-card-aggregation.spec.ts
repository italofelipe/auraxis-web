import { describe, expect, it } from "vitest";

import type { TagDto } from "~/features/tags/contracts/tag.dto";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { EnrichedTransaction } from "../utils/transaction-billing";
import {
  NO_CATEGORY_LABEL,
  buildMonthlySeriesByCard,
  cardBreakdown,
  filterByBillMonth,
  filterByCard,
  groupByCategory,
  monthVariation,
  sumAmount,
  topTransactions,
} from "./credit-card-aggregation";

/**
 * Builds an EnrichedTransaction with defaults for tests.
 *
 * @param partial Fields to override.
 * @returns Complete EnrichedTransaction.
 */
const etx = (partial: Partial<EnrichedTransaction>): EnrichedTransaction => ({
  transaction: { id: partial.id ?? "tx-1" } as TransactionDto,
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
  isRecurring: false,
  status: "pending",
  ...partial,
});

const TAGS: TagDto[] = [
  { id: "t-food", name: "Alimentação", color: "#11A36B", icon: null },
  { id: "t-transport", name: "Transporte", color: null, icon: null },
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

describe("sumAmount", () => {
  it("sums transaction amounts", () => {
    expect(sumAmount([etx({ amount: 10 }), etx({ amount: 5.5 })])).toBe(15.5);
  });
});

describe("filterByBillMonth", () => {
  it("keeps only the target bill month", () => {
    const result = filterByBillMonth(
      [etx({ id: "a", billMonth: "2026-06" }), etx({ id: "b", billMonth: "2026-07" })],
      "2026-06",
    );
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("filterByCard", () => {
  it("returns all transactions when cardId is null", () => {
    const txs = [etx({ creditCardId: "cc-1" }), etx({ creditCardId: "cc-2" })];
    expect(filterByCard(txs, null)).toHaveLength(2);
  });

  it("filters by the given card", () => {
    const result = filterByCard(
      [etx({ id: "a", creditCardId: "cc-1" }), etx({ id: "b", creditCardId: "cc-2" })],
      "cc-2",
    );
    expect(result.map((t) => t.id)).toEqual(["b"]);
  });
});

describe("groupByCategory", () => {
  it("groups by tag, sorts by total desc, and labels untagged items", () => {
    const groups = groupByCategory(
      [
        etx({ tagId: "t-food", amount: 30 }),
        etx({ tagId: "t-transport", amount: 80 }),
        etx({ tagId: null, amount: 10 }),
      ],
      TAGS,
    );

    expect(groups.map((g) => g.total)).toEqual([80, 30, 10]);
    expect(groups[0]?.name).toBe("Transporte");
    expect(groups[2]?.name).toBe(NO_CATEGORY_LABEL);
  });

  it("uses the tag color and a stable fallback for color-less tags", () => {
    const groups = groupByCategory([etx({ tagId: "t-food" }), etx({ tagId: "t-transport" })], TAGS);
    const food = groups.find((g) => g.tagId === "t-food");
    const transport = groups.find((g) => g.tagId === "t-transport");
    expect(food?.color).toBe("#11A36B");
    // Transporte tem cor null → fallback estável pelo índice (1) da paleta.
    expect(transport?.color).toMatch(/^#/);
    expect(transport?.color).not.toBe("#11A36B");
  });
});

describe("cardBreakdown", () => {
  it("totals per card sorted desc", () => {
    const result = cardBreakdown(
      [
        etx({ creditCardId: "cc-1", amount: 100 }),
        etx({ creditCardId: "cc-2", amount: 250 }),
        etx({ creditCardId: "cc-1", amount: 50 }),
      ],
      CARDS,
    );
    expect(result).toEqual([
      { cardId: "cc-2", name: "Inter", total: 250 },
      { cardId: "cc-1", name: "Nubank", total: 150 },
    ]);
  });
});

describe("buildMonthlySeriesByCard", () => {
  it("places amounts in the right month/card cell", () => {
    const result = buildMonthlySeriesByCard(
      [
        etx({ creditCardId: "cc-1", billMonth: "2026-05", amount: 100 }),
        etx({ creditCardId: "cc-1", billMonth: "2026-06", amount: 200 }),
        etx({ creditCardId: "cc-2", billMonth: "2026-06", amount: 50 }),
      ],
      CARDS,
      ["2026-05", "2026-06"],
    );

    expect(result.series).toEqual([
      { cardId: "cc-1", name: "Nubank", values: [100, 200] },
      { cardId: "cc-2", name: "Inter", values: [0, 50] },
    ]);
  });
});

describe("topTransactions", () => {
  it("returns the largest N by amount", () => {
    const result = topTransactions(
      [etx({ id: "a", amount: 10 }), etx({ id: "b", amount: 90 }), etx({ id: "c", amount: 50 })],
      2,
    );
    expect(result.map((t) => t.id)).toEqual(["b", "c"]);
  });
});

describe("monthVariation", () => {
  it("computes delta and percentage", () => {
    expect(monthVariation(150, 100)).toEqual({ delta: 50, pct: 50 });
  });

  it("returns null percentage when the previous month is zero", () => {
    expect(monthVariation(150, 0)).toEqual({ delta: 150, pct: null });
  });
});
