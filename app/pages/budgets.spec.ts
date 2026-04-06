import { describe, expect, it } from "vitest";

import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";

let _budgetCounter = 0;

/**
 * Increments and returns the next budget counter value.
 *
 * @returns Next sequential counter.
 */
const nextId = (): number => {
  _budgetCounter += 1;
  return _budgetCounter;
};

/**
 * Builds a BudgetDto fixture with configurable amount and spent values.
 *
 * @param amount - Decimal string for the budgeted amount.
 * @param spent - Decimal string for the spent amount.
 * @returns BudgetDto fixture.
 */
const makeBudget = (amount: string, spent: string): BudgetDto => ({
  id: `budget-${nextId()}`,
  name: "Fixture",
  amount,
  spent,
  remaining: (parseFloat(amount) - parseFloat(spent)).toFixed(2),
  percentage_used: (parseFloat(spent) / parseFloat(amount)) * 100,
  period: "monthly",
  start_date: null,
  end_date: null,
  tag_id: null,
  tag_name: null,
  tag_color: null,
  is_active: true,
  is_over_budget: parseFloat(spent) > parseFloat(amount),
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
});

// Pure helper functions extracted from budgets.vue logic for unit testing.

/**
 * Computes total budgeted amount from a list of budgets.
 *
 * @param budgets - List of BudgetDto items.
 * @returns Sum of all budget amounts.
 */
const totalBudgeted = (budgets: BudgetDto[]): number =>
  budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);

/**
 * Computes total spent amount from a list of budgets.
 *
 * @param budgets - List of BudgetDto items.
 * @returns Sum of all spent amounts.
 */
const totalSpent = (budgets: BudgetDto[]): number =>
  budgets.reduce((sum, b) => sum + parseFloat(b.spent), 0);

/**
 * Computes remaining amount from budgeted and spent totals.
 *
 * @param budgeted - Total budgeted amount.
 * @param spent - Total spent amount.
 * @returns Remaining amount (may be negative if over budget).
 */
const totalRemaining = (budgeted: number, spent: number): number => budgeted - spent;

/**
 * Computes the overall percentage of budget used, clamped to 100.
 *
 * @param budgeted - Total budgeted amount.
 * @param spent - Total spent amount.
 * @returns Integer percentage 0-100.
 */
const overallPercentage = (budgeted: number, spent: number): number =>
  budgeted > 0 ? Math.min(Math.round((spent / budgeted) * 100), 100) : 0;

/**
 * Returns the progress bar status based on percentage used.
 *
 * @param pct - Percentage used (0-100+).
 * @returns Naive UI status string.
 */
const progressStatus = (pct: number): "default" | "warning" | "error" => {
  if (pct >= 100) { return "error"; }
  if (pct >= 80) { return "warning"; }
  return "default";
};

/**
 * Clamps a percentage value to 0-100.
 *
 * @param pct - Raw percentage that may exceed 100.
 * @returns Clamped integer percentage.
 */
const clampedPct = (pct: number): number => Math.min(Math.round(pct), 100);

describe("budgets page — aggregate computed helpers", () => {
  it("returns 0 for all aggregates when budget list is empty", (): void => {
    const budgets: BudgetDto[] = [];
    const budgeted = totalBudgeted(budgets);
    const spent = totalSpent(budgets);

    expect(budgeted).toBe(0);
    expect(spent).toBe(0);
    expect(totalRemaining(budgeted, spent)).toBe(0);
    expect(overallPercentage(budgeted, spent)).toBe(0);
  });

  it("sums amount and spent across multiple budgets", (): void => {
    const budgets = [makeBudget("800.00", "200.00"), makeBudget("500.00", "300.00")];

    expect(totalBudgeted(budgets)).toBeCloseTo(1300);
    expect(totalSpent(budgets)).toBeCloseTo(500);
  });

  it("computes totalRemaining as budgeted minus spent", (): void => {
    expect(totalRemaining(1300, 500)).toBe(800);
  });

  it("computes totalRemaining as negative when over budget", (): void => {
    expect(totalRemaining(500, 600)).toBe(-100);
  });

  it("computes overallPercentage correctly for partial spend", (): void => {
    // 500 / 1000 = 50%
    expect(overallPercentage(1000, 500)).toBe(50);
  });

  it("clamps overallPercentage to 100 when over budget", (): void => {
    expect(overallPercentage(500, 700)).toBe(100);
  });

  it("returns 0 for overallPercentage when totalBudgeted is 0", (): void => {
    expect(overallPercentage(0, 0)).toBe(0);
    expect(overallPercentage(0, 100)).toBe(0);
  });
});

describe("budgets page — progressStatus helper", () => {
  it("returns 'default' below 80%", (): void => {
    expect(progressStatus(0)).toBe("default");
    expect(progressStatus(50)).toBe("default");
    expect(progressStatus(79)).toBe("default");
  });

  it("returns 'warning' at 80% and up to 99%", (): void => {
    expect(progressStatus(80)).toBe("warning");
    expect(progressStatus(95)).toBe("warning");
    expect(progressStatus(99)).toBe("warning");
  });

  it("returns 'error' at 100% or above", (): void => {
    expect(progressStatus(100)).toBe("error");
    expect(progressStatus(120)).toBe("error");
  });
});

describe("budgets page — clampedPct helper", () => {
  it("returns value unchanged when below 100", (): void => {
    expect(clampedPct(75)).toBe(75);
  });

  it("rounds to nearest integer", (): void => {
    expect(clampedPct(74.6)).toBe(75);
    expect(clampedPct(74.4)).toBe(74);
  });

  it("clamps values above 100 to 100", (): void => {
    expect(clampedPct(120)).toBe(100);
    expect(clampedPct(150.9)).toBe(100);
  });
});
