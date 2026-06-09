import type { TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";
import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import { parseCurrencyAmount } from "~/utils/currencyInput";

export interface BudgetImpactPreview {
  readonly budgetId: string;
  readonly budgetName: string;
  readonly tagName: string | null;
  readonly currentSpent: number;
  readonly transactionAmount: number;
  readonly projectedSpent: number;
  readonly limitAmount: number;
  readonly remainingAfter: number;
  readonly percentageAfter: number;
  readonly isOverBudget: boolean;
}

export interface BuildBudgetImpactPreviewInput {
  readonly budgets: readonly BudgetDto[];
  readonly transactionType: TransactionTypeDto;
  readonly tagId: string | null;
  readonly amount: number | null;
}

/**
 * Builds the read-only budget impact preview shown in transaction forms.
 *
 * The preview intentionally does not create or expose a `budget_id` payload
 * field; budgets are impacted through the existing tag/envelope classification.
 *
 * @param input Current budget list and draft transaction fields.
 * @returns Projected budget impact, or null when the transaction should not affect a budget.
 */
export function buildBudgetImpactPreview(
  input: BuildBudgetImpactPreviewInput,
): BudgetImpactPreview | null {
  if (input.transactionType !== "expense" || !input.tagId || input.amount === null || input.amount <= 0) {
    return null;
  }

  const budget = input.budgets.find(
    (item) => item.is_active && item.tag_id === input.tagId,
  );
  if (!budget) {
    return null;
  }

  const currentSpent = Math.max(parseCurrencyAmount(budget.spent), 0);
  const limitAmount = Math.max(parseCurrencyAmount(budget.amount), 0);
  const transactionAmount = input.amount;
  const projectedSpent = currentSpent + transactionAmount;
  const remainingAfter = limitAmount - projectedSpent;
  const percentageAfter = limitAmount > 0 ? Math.round((projectedSpent / limitAmount) * 100) : 0;

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    tagName: budget.tag_name,
    currentSpent,
    transactionAmount,
    projectedSpent,
    limitAmount,
    remainingAfter,
    percentageAfter,
    isOverBudget: projectedSpent > limitAmount,
  };
}
