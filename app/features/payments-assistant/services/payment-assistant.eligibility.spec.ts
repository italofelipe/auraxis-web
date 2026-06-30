import { describe, expect, it } from "vitest";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import type { Subscription } from "~/features/subscription/model/subscription";

import {
  OVERDUE_THRESHOLD_DAYS,
  isOverdueByAtLeastDays,
  isPremiumSubscription,
  selectOverdueCandidates,
} from "./payment-assistant.eligibility";

/**
 * Builds a TransactionDto with sensible defaults, overridable per test.
 *
 * @param overrides Fields to override.
 * @returns A transaction fixture.
 */
const makeTransaction = (overrides: Partial<TransactionDto> = {}): TransactionDto => ({
  id: "tx-1",
  title: "Aluguel",
  amount: "1200.00",
  type: "expense",
  due_date: "2026-05-01",
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
  credit_card_id: null,
  installment_group_id: null,
  paid_at: null,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: null,
  ...overrides,
});

const TODAY = new Date(2026, 5, 29); // 2026-06-29 (local)

describe("isOverdueByAtLeastDays", () => {
  it("is true for a due date older than the threshold", () => {
    expect(isOverdueByAtLeastDays("2026-04-01", 30, TODAY)).toBe(true);
  });

  it("is true exactly on the cutoff boundary (today - days)", () => {
    expect(isOverdueByAtLeastDays("2026-05-30", 30, TODAY)).toBe(true);
  });

  it("is false one day inside the threshold window", () => {
    expect(isOverdueByAtLeastDays("2026-05-31", 30, TODAY)).toBe(false);
  });

  it("is false for a future due date", () => {
    expect(isOverdueByAtLeastDays("2026-07-15", 30, TODAY)).toBe(false);
  });
});

describe("selectOverdueCandidates", () => {
  it("keeps only pending/postponed transactions overdue beyond the threshold", () => {
    const transactions = [
      makeTransaction({ id: "pending-old", status: "pending", due_date: "2026-04-10" }),
      makeTransaction({ id: "postponed-old", status: "postponed", due_date: "2026-03-20" }),
      makeTransaction({ id: "paid-old", status: "paid", due_date: "2026-04-10" }),
      makeTransaction({ id: "cancelled-old", status: "cancelled", due_date: "2026-04-10" }),
      makeTransaction({ id: "pending-recent", status: "pending", due_date: "2026-06-20" }),
    ];

    const result = selectOverdueCandidates(transactions, TODAY);

    expect(result.map((t) => t.id)).toEqual(["postponed-old", "pending-old"]);
  });

  it("sorts by due date ascending (oldest first)", () => {
    const transactions = [
      makeTransaction({ id: "b", status: "pending", due_date: "2026-04-15" }),
      makeTransaction({ id: "a", status: "pending", due_date: "2026-02-01" }),
      makeTransaction({ id: "c", status: "pending", due_date: "2026-05-01" }),
    ];

    const result = selectOverdueCandidates(transactions, TODAY);

    expect(result.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array when nothing qualifies", () => {
    const transactions = [
      makeTransaction({ status: "paid", due_date: "2026-01-01" }),
      makeTransaction({ status: "pending", due_date: "2026-06-28" }),
    ];

    expect(selectOverdueCandidates(transactions, TODAY)).toEqual([]);
  });

  it("exposes a 30-day default threshold", () => {
    expect(OVERDUE_THRESHOLD_DAYS).toBe(30);
  });
});

describe("isPremiumSubscription", () => {
  /**
   * Builds a Subscription fixture, overridable per test.
   *
   * @param overrides Fields to override.
   * @returns A subscription fixture.
   */
  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    id: "sub-1",
    planSlug: "premium",
    status: "active",
    trialEndsAt: null,
    currentPeriodEnd: null,
    provider: null,
    providerSubscriptionId: null,
    ...overrides,
  });

  it("is true for an active paid plan", () => {
    expect(isPremiumSubscription(makeSubscription({ status: "active" }))).toBe(true);
  });

  it("is true while trialing a paid plan", () => {
    expect(isPremiumSubscription(makeSubscription({ status: "trialing", planSlug: "pro" }))).toBe(
      true,
    );
  });

  it("is false for the free plan even when active", () => {
    expect(isPremiumSubscription(makeSubscription({ planSlug: "free" }))).toBe(false);
  });

  it("is false for past_due or canceled status", () => {
    expect(isPremiumSubscription(makeSubscription({ status: "past_due" }))).toBe(false);
    expect(isPremiumSubscription(makeSubscription({ status: "canceled" }))).toBe(false);
  });

  it("is false for null/undefined subscription", () => {
    expect(isPremiumSubscription(null)).toBe(false);
    expect(isPremiumSubscription(undefined)).toBe(false);
  });
});
