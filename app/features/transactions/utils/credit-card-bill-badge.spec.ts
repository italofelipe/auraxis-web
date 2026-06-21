import { describe, expect, it } from "vitest";

import {
  formatBillMonthLabel,
  resolveCreditCardBillBadge,
} from "./credit-card-bill-badge";

/**
 * First day of a month as a local timestamp — mirrors how
 * `useTransactionFilters` stores the selected month (start-of-month epoch ms).
 *
 * @param year       Full year.
 * @param monthIndex Zero-based month index (0 = January).
 * @returns Epoch milliseconds for the first day of that month.
 */
function monthStart(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getTime();
}

describe("formatBillMonthLabel", () => {
  it("formats a selected month timestamp as short pt-BR mmm/aa", () => {
    expect(formatBillMonthLabel(monthStart(2026, 6))).toBe("jul/26");
  });

  it("formats january without a trailing period", () => {
    expect(formatBillMonthLabel(monthStart(2026, 0))).toBe("jan/26");
  });

  it("formats december of a previous year", () => {
    expect(formatBillMonthLabel(monthStart(2025, 11))).toBe("dez/25");
  });

  it("derives the month from any day inside it, not only the first", () => {
    expect(formatBillMonthLabel(new Date(2026, 2, 31, 23, 59).getTime())).toBe(
      "mar/26",
    );
  });
});

describe("resolveCreditCardBillBadge", () => {
  it("returns the bill badge when a card purchase fell on another month", () => {
    // Selected month = July/26, purchase due_date in June → temporal borrow.
    const badge = resolveCreditCardBillBadge({
      creditCardId: "card-1",
      dueDate: "2026-06-19",
      periodMode: "month",
      selectedMonthTimestamp: monthStart(2026, 6),
    });

    expect(badge).toEqual({ billMonthLabel: "jul/26" });
  });

  it("returns null when due_date month matches the selected month", () => {
    // Purchase in July, viewing July → no borrow, no badge (avoids noise).
    expect(
      resolveCreditCardBillBadge({
        creditCardId: "card-1",
        dueDate: "2026-07-04",
        periodMode: "month",
        selectedMonthTimestamp: monthStart(2026, 6),
      }),
    ).toBeNull();
  });

  it("distinguishes the same month across different years", () => {
    // due_date July/2025 while viewing July/2026 → still a borrow.
    expect(
      resolveCreditCardBillBadge({
        creditCardId: "card-1",
        dueDate: "2025-07-19",
        periodMode: "month",
        selectedMonthTimestamp: monthStart(2026, 6),
      }),
    ).toEqual({ billMonthLabel: "jul/26" });
  });

  it("returns null for non credit-card transactions", () => {
    expect(
      resolveCreditCardBillBadge({
        creditCardId: null,
        dueDate: "2026-06-19",
        periodMode: "month",
        selectedMonthTimestamp: monthStart(2026, 6),
      }),
    ).toBeNull();
  });

  it("returns null in custom period mode even with a date mismatch", () => {
    // Custom range keeps the raw due_date; the badge must not appear.
    expect(
      resolveCreditCardBillBadge({
        creditCardId: "card-1",
        dueDate: "2026-06-19",
        periodMode: "custom",
        selectedMonthTimestamp: monthStart(2026, 6),
      }),
    ).toBeNull();
  });

  it("returns null when the selected month timestamp is unavailable", () => {
    expect(
      resolveCreditCardBillBadge({
        creditCardId: "card-1",
        dueDate: "2026-06-19",
        periodMode: "month",
        selectedMonthTimestamp: null,
      }),
    ).toBeNull();
  });

  it("returns null when the due_date is malformed", () => {
    expect(
      resolveCreditCardBillBadge({
        creditCardId: "card-1",
        dueDate: "not-a-date",
        periodMode: "month",
        selectedMonthTimestamp: monthStart(2026, 6),
      }),
    ).toBeNull();
  });
});
