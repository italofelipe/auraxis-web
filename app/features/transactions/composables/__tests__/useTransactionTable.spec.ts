import { describe, expect, it } from "vitest";
import { formatTransactionDate, isTransactionNearDue, isTransactionOverdue } from "../useTransactionTable";

describe("formatTransactionDate", () => {
  it("formats YYYY-MM-DD as dd/MM/yyyy", () => {
    expect(formatTransactionDate("2026-03-07")).toBe("07/03/2026");
  });

  it("pads single-digit day and month", () => {
    expect(formatTransactionDate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("isTransactionOverdue", () => {
  it("returns false for paid transactions regardless of due date", () => {
    expect(isTransactionOverdue("2020-01-01", "paid")).toBe(false);
  });

  it("returns true for past due date with pending status", () => {
    expect(isTransactionOverdue("2020-01-01", "pending")).toBe(true);
  });

  it("returns false for future due date with pending status", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const isoDate = future.toISOString().slice(0, 10);
    expect(isTransactionOverdue(isoDate, "pending")).toBe(false);
  });
});

describe("isTransactionNearDue", () => {
  it("returns false for paid transactions", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTransactionNearDue(tomorrow.toISOString().slice(0, 10), "paid")).toBe(false);
  });

  it("returns true for unpaid transaction due within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(isTransactionNearDue(soon.toISOString().slice(0, 10), "pending")).toBe(true);
  });

  it("returns false for unpaid transaction due in 8+ days", () => {
    const far = new Date();
    far.setDate(far.getDate() + 10);
    expect(isTransactionNearDue(far.toISOString().slice(0, 10), "pending")).toBe(false);
  });

  it("returns false for overdue (past) transactions", () => {
    expect(isTransactionNearDue("2020-01-01", "pending")).toBe(false);
  });
});
