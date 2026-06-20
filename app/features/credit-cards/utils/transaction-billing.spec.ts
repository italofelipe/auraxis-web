import { describe, expect, it } from "vitest";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import { MOCK_CREDIT_CARDS } from "../mock/credit-cards.mock";
import {
  billMonthsWindow,
  billWindowStartDate,
  enrichCardTransactions,
  monthEndDate,
  monthKeyLabel,
  monthKeyShort,
  resolveCardCycleForMonth,
  shiftMonthKey,
} from "./transaction-billing";

/**
 * Builds a TransactionDto with sensible defaults for tests.
 *
 * @param partial Fields to override.
 * @returns Complete TransactionDto.
 */
const tx = (partial: Partial<TransactionDto>): TransactionDto => ({
  id: "tx-1",
  title: "Compra",
  amount: "100.00",
  type: "expense",
  due_date: "2026-06-02",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  recurrence_interval: 1,
  recurrence_unit: "month",
  currency: "BRL",
  status: "pending",
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: "cc-1",
  impact_policy: "full",
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
  ...partial,
});

describe("enrichCardTransactions", () => {
  it("drops transactions without a credit card", () => {
    const result = enrichCardTransactions(
      [tx({ id: "a", credit_card_id: null }), tx({ id: "b", credit_card_id: "cc-1" })],
      MOCK_CREDIT_CARDS,
    );
    expect(result.map((t) => t.id)).toEqual(["b"]);
  });

  it("resolves the bill month from the card cycle (purchase before closing)", () => {
    // cc-1: closing_day 3 → compra dia 02 cai na fatura de junho.
    const [enriched] = enrichCardTransactions(
      [tx({ credit_card_id: "cc-1", due_date: "2026-06-02" })],
      MOCK_CREDIT_CARDS,
    );
    expect(enriched?.billMonth).toBe("2026-06");
  });

  it("moves purchases after closing to the next bill month", () => {
    // cc-1: closing_day 3 → compra dia 10 cai na fatura de julho.
    const [enriched] = enrichCardTransactions(
      [tx({ credit_card_id: "cc-1", due_date: "2026-06-10" })],
      MOCK_CREDIT_CARDS,
    );
    expect(enriched?.billMonth).toBe("2026-07");
  });

  it("coerces the amount to a number", () => {
    const [enriched] = enrichCardTransactions([tx({ amount: "1234.56" })], MOCK_CREDIT_CARDS);
    expect(enriched?.amount).toBe(1234.56);
  });

  it("keeps the transaction but leaves billMonth null for an unknown card", () => {
    const [enriched] = enrichCardTransactions(
      [tx({ credit_card_id: "cc-unknown" })],
      MOCK_CREDIT_CARDS,
    );
    expect(enriched?.creditCardId).toBe("cc-unknown");
    expect(enriched?.billMonth).toBeNull();
  });
});

describe("billMonthsWindow", () => {
  it("returns N ascending months ending at endMonth", () => {
    expect(billMonthsWindow("2026-06", 6)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
  });

  it("wraps across the year boundary", () => {
    expect(billMonthsWindow("2026-02", 4)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("billWindowStartDate", () => {
  it("starts one month before the window for cycle slack", () => {
    expect(billWindowStartDate("2026-06", 6)).toBe("2025-12-01");
  });
});

describe("monthEndDate", () => {
  it("returns the last day of the month (short month)", () => {
    expect(monthEndDate("2026-02")).toBe("2026-02-28");
  });

  it("returns the last day of a 31-day month", () => {
    expect(monthEndDate("2026-07")).toBe("2026-07-31");
  });
});

describe("shiftMonthKey", () => {
  it("shifts forward and backward across years", () => {
    expect(shiftMonthKey("2026-06", 1)).toBe("2026-07");
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2026-12", 2)).toBe("2027-02");
  });
});

describe("monthKeyLabel / monthKeyShort", () => {
  it("formats a long Portuguese label", () => {
    expect(monthKeyLabel("2026-06")).toBe("junho de 2026");
  });

  it("formats a short Portuguese abbreviation", () => {
    expect(monthKeyShort("2026-06")).toBe("Jun");
  });
});

describe("resolveCardCycleForMonth", () => {
  it("returns a cycle whose bill month matches the requested month", () => {
    // cc-1: closing_day 3, due_day 10.
    const cycle = resolveCardCycleForMonth(MOCK_CREDIT_CARDS[0]!, "2026-06");
    expect(cycle?.billMonth).toBe("2026-06");
    expect(cycle?.dueDate).toBe("2026-06-10");
  });

  it("returns null when the card has no cycle configured", () => {
    expect(resolveCardCycleForMonth({ closing_day: null, due_day: null }, "2026-06")).toBeNull();
  });
});
