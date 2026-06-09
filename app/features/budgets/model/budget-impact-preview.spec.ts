import { describe, expect, it } from "vitest";

import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import { buildBudgetImpactPreview } from "./budget-impact-preview";

/**
 * Builds a budget fixture for preview behavior tests.
 *
 * @param overrides Partial budget fields to override.
 * @returns Budget DTO fixture.
 */
const makeBudget = (overrides: Partial<BudgetDto> = {}): BudgetDto => ({
  id: "budget-streaming",
  name: "Streaming",
  amount: "200.00",
  spent: "180.00",
  remaining: "20.00",
  percentage_used: 90,
  period: "monthly",
  start_date: null,
  end_date: null,
  tag_id: "tag-streaming",
  tag_name: "Streaming",
  tag_color: "#06b6d4",
  is_active: true,
  is_over_budget: false,
  created_at: "2026-06-01T12:00:00Z",
  updated_at: "2026-06-01T12:00:00Z",
  ...overrides,
});

describe("buildBudgetImpactPreview", () => {
  it("projects an expense impact for the matching envelope tag", () => {
    const preview = buildBudgetImpactPreview({
      budgets: [makeBudget()],
      transactionType: "expense",
      tagId: "tag-streaming",
      amount: 50,
    });

    expect(preview).toEqual({
      budgetId: "budget-streaming",
      budgetName: "Streaming",
      tagName: "Streaming",
      currentSpent: 180,
      transactionAmount: 50,
      projectedSpent: 230,
      limitAmount: 200,
      remainingAfter: -30,
      percentageAfter: 115,
      isOverBudget: true,
    });
  });

  it("returns null for income, missing tag, missing amount or no active matching budget", () => {
    expect(buildBudgetImpactPreview({
      budgets: [makeBudget()],
      transactionType: "income",
      tagId: "tag-streaming",
      amount: 50,
    })).toBeNull();
    expect(buildBudgetImpactPreview({
      budgets: [makeBudget()],
      transactionType: "expense",
      tagId: null,
      amount: 50,
    })).toBeNull();
    expect(buildBudgetImpactPreview({
      budgets: [makeBudget()],
      transactionType: "expense",
      tagId: "tag-streaming",
      amount: null,
    })).toBeNull();
    expect(buildBudgetImpactPreview({
      budgets: [makeBudget({ is_active: false })],
      transactionType: "expense",
      tagId: "tag-streaming",
      amount: 50,
    })).toBeNull();
  });

  it("does not add budget_id to the transaction payload contract", () => {
    const preview = buildBudgetImpactPreview({
      budgets: [makeBudget()],
      transactionType: "expense",
      tagId: "tag-streaming",
      amount: 10,
    });

    expect(preview).not.toHaveProperty("budget_id");
    expect(preview).not.toHaveProperty("budgetIdForPayload");
  });
});
