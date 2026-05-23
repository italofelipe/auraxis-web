import { describe, expect, it } from "vitest";

import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import type { Subscription } from "~/features/subscription/model/subscription";
import {
  BUDGET_FREE_ENVELOPE_LIMIT,
  buildBudgetQuotaState,
  getBudgetUsageLevel,
  normalizeBudgetEnvelope,
  summarizeBudgetEnvelopes,
} from "./budget-envelope";

/**
 * Builds a budget DTO fixture for envelope model tests.
 *
 * @param overrides Field overrides for the fixture.
 * @returns Budget DTO fixture.
 */
const makeBudget = (overrides: Partial<BudgetDto> = {}): BudgetDto => ({
  id: "budget-1",
  name: "Mercado",
  amount: "1000.00",
  spent: "250.00",
  remaining: "750.00",
  percentage_used: 25,
  period: "monthly",
  start_date: null,
  end_date: null,
  tag_id: "tag-1",
  tag_name: "Alimentação",
  tag_color: "#2dd4bf",
  is_active: true,
  is_over_budget: false,
  created_at: "2026-05-01T12:00:00Z",
  updated_at: "2026-05-01T12:00:00Z",
  ...overrides,
});

/**
 * Builds a subscription fixture for freemium quota tests.
 *
 * @param overrides Field overrides for the fixture.
 * @returns Subscription fixture.
 */
const makeSubscription = (
  overrides: Partial<Subscription> = {},
): Subscription => ({
  id: "sub-1",
  planSlug: "free",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: null,
  providerSubscriptionId: null,
  ...overrides,
});

describe("normalizeBudgetEnvelope", () => {
  it("normalizes valid API decimals into finite envelope values", () => {
    const envelope = normalizeBudgetEnvelope(makeBudget());

    expect(envelope.amount).toBe(1000);
    expect(envelope.spent).toBe(250);
    expect(envelope.remaining).toBe(750);
    expect(envelope.percentageUsed).toBe(25);
    expect(envelope.displayPercentage).toBe(25);
    expect(envelope.usageLevel).toBe("healthy");
  });

  it("derives safe percentage and remaining when API values are invalid", () => {
    const envelope = normalizeBudgetEnvelope(
      makeBudget({
        amount: "0.00",
        spent: "NaN",
        remaining: "Infinity",
        percentage_used: Number.NaN,
      }),
    );

    expect(envelope.amount).toBe(0);
    expect(envelope.spent).toBe(0);
    expect(envelope.remaining).toBe(0);
    expect(envelope.percentageUsed).toBe(0);
    expect(envelope.displayPercentage).toBe(0);
    expect(envelope.progressPercentage).toBe(0);
  });

  it("marks overspent budgets as danger and keeps raw percentage readable", () => {
    const envelope = normalizeBudgetEnvelope(
      makeBudget({
        amount: "500.00",
        spent: "650.00",
        percentage_used: 130,
        is_over_budget: true,
      }),
    );

    expect(envelope.remaining).toBe(-150);
    expect(envelope.percentageUsed).toBe(130);
    expect(envelope.displayPercentage).toBe(130);
    expect(envelope.progressPercentage).toBe(100);
    expect(envelope.usageLevel).toBe("danger");
    expect(envelope.progressStatus).toBe("error");
  });
});

describe("getBudgetUsageLevel", () => {
  it("classifies usage as healthy, warning or danger", () => {
    expect(getBudgetUsageLevel(79, false)).toBe("healthy");
    expect(getBudgetUsageLevel(80, false)).toBe("warning");
    expect(getBudgetUsageLevel(99, false)).toBe("warning");
    expect(getBudgetUsageLevel(100, false)).toBe("danger");
    expect(getBudgetUsageLevel(42, true)).toBe("danger");
  });
});

describe("summarizeBudgetEnvelopes", () => {
  it("builds finite totals and counts attention states", () => {
    const summary = summarizeBudgetEnvelopes([
      normalizeBudgetEnvelope(makeBudget({ id: "ok", amount: "1000", spent: "200" })),
      normalizeBudgetEnvelope(makeBudget({ id: "warn", amount: "1000", spent: "850" })),
      normalizeBudgetEnvelope(makeBudget({ id: "danger", amount: "1000", spent: "1100" })),
    ]);

    expect(summary.totalBudgeted).toBe(3000);
    expect(summary.totalSpent).toBe(2150);
    expect(summary.totalRemaining).toBe(850);
    expect(summary.overallPercentage).toBe(72);
    expect(summary.warningCount).toBe(1);
    expect(summary.dangerCount).toBe(1);
  });
});

describe("buildBudgetQuotaState", () => {
  it("limits free users to three budget envelopes", () => {
    const quota = buildBudgetQuotaState({
      budgetCount: BUDGET_FREE_ENVELOPE_LIMIT,
      subscription: makeSubscription(),
    });

    expect(quota.isPremium).toBe(false);
    expect(quota.limit).toBe(BUDGET_FREE_ENVELOPE_LIMIT);
    expect(quota.canCreate).toBe(false);
    expect(quota.remainingSlots).toBe(0);
    expect(quota.label).toContain("3 de 3");
  });

  it("allows free users below the limit to create another envelope", () => {
    const quota = buildBudgetQuotaState({
      budgetCount: 2,
      subscription: makeSubscription(),
    });

    expect(quota.canCreate).toBe(true);
    expect(quota.remainingSlots).toBe(1);
  });

  it("treats active premium and legacy pro subscriptions as unlimited", () => {
    const premium = buildBudgetQuotaState({
      budgetCount: 12,
      subscription: makeSubscription({ planSlug: "premium", status: "active" }),
    });
    const legacyPro = buildBudgetQuotaState({
      budgetCount: 12,
      subscription: makeSubscription({ planSlug: "pro", status: "trialing" }),
    });

    expect(premium.canCreate).toBe(true);
    expect(premium.limit).toBe(null);
    expect(premium.label).toBe("Premium: envelopes ilimitados");
    expect(legacyPro.canCreate).toBe(true);
  });
});
