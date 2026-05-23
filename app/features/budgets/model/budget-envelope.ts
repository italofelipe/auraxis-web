import type { BudgetDto } from "~/features/budgets/contracts/budget.contracts";
import type { Subscription } from "~/features/subscription/model/subscription";
import { parseCurrencyAmount } from "~/utils/currencyInput";

export const BUDGET_FREE_ENVELOPE_LIMIT = 3;

export type BudgetUsageLevel = "healthy" | "warning" | "danger";

export type BudgetProgressStatus = "default" | "warning" | "error";

export interface BudgetEnvelopeView {
  readonly raw: BudgetDto;
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly spent: number;
  readonly remaining: number;
  readonly percentageUsed: number;
  readonly displayPercentage: number;
  readonly progressPercentage: number;
  readonly usageLevel: BudgetUsageLevel;
  readonly progressStatus: BudgetProgressStatus;
  readonly tagName: string | null;
  readonly tagColor: string | null;
  readonly isOverBudget: boolean;
}

export interface BudgetEnvelopeSummary {
  readonly totalBudgeted: number;
  readonly totalSpent: number;
  readonly totalRemaining: number;
  readonly overallPercentage: number;
  readonly warningCount: number;
  readonly dangerCount: number;
}

export interface BudgetQuotaState {
  readonly isPremium: boolean;
  readonly limit: number | null;
  readonly used: number;
  readonly remainingSlots: number | null;
  readonly canCreate: boolean;
  readonly label: string;
}

interface BudgetQuotaInput {
  readonly budgetCount: number;
  readonly subscription: Subscription | null | undefined;
}

/**
 * Converts a loose numeric value into a finite number.
 *
 * @param value Raw numeric-like value.
 * @param fallback Value used when the input is not finite.
 * @returns Finite number.
 */
const finiteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

/**
 * Converts a raw percentage into a safe 0-100 integer for progress bars.
 *
 * @param value Raw percentage.
 * @returns Clamped display percentage.
 */
const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
};

/**
 * Derives the usage percentage from budgeted and spent amounts.
 *
 * @param spent Spent amount.
 * @param amount Budgeted amount.
 * @param apiPercentage Backend-provided fallback percentage.
 * @returns Non-negative usage percentage.
 */
const safePercentage = (spent: number, amount: number, apiPercentage: unknown): number => {
  if (amount <= 0) {
    const provided = finiteNumber(apiPercentage, Number.NaN);
    return Number.isFinite(provided) ? Math.max(provided, 0) : 0;
  }

  return Math.max((spent / amount) * 100, 0);
};

/**
 * Classifies a budget by how close it is to the spending limit.
 *
 * @param percentageUsed Percentage already consumed.
 * @param isOverBudget Whether the backend already flagged the budget as over.
 * @returns Usage level used by tags and card accents.
 */
export const getBudgetUsageLevel = (
  percentageUsed: number,
  isOverBudget: boolean,
): BudgetUsageLevel => {
  if (isOverBudget || percentageUsed >= 100) {
    return "danger";
  }

  if (percentageUsed >= 80) {
    return "warning";
  }

  return "healthy";
};

/**
 * Maps budget usage level to Naive UI progress status.
 *
 * @param usageLevel Classified budget usage level.
 * @returns Progress status understood by Naive UI.
 */
export const getBudgetProgressStatus = (
  usageLevel: BudgetUsageLevel,
): BudgetProgressStatus => {
  if (usageLevel === "danger") {
    return "error";
  }

  if (usageLevel === "warning") {
    return "warning";
  }

  return "default";
};

/**
 * Normalizes an API budget row into a finite UI envelope.
 *
 * @param budget Raw API budget DTO.
 * @returns View model safe for cards, summaries and progress bars.
 */
export const normalizeBudgetEnvelope = (budget: BudgetDto): BudgetEnvelopeView => {
  const amount = Math.max(parseCurrencyAmount(budget.amount), 0);
  const spent = Math.max(parseCurrencyAmount(budget.spent), 0);
  const remaining = amount - spent;
  const percentageUsed = safePercentage(spent, amount, budget.percentage_used);
  const isOverBudget = budget.is_over_budget || spent > amount;
  const usageLevel = getBudgetUsageLevel(percentageUsed, isOverBudget);

  return {
    raw: budget,
    id: budget.id,
    name: budget.name,
    amount,
    spent,
    remaining,
    percentageUsed,
    displayPercentage: Math.round(percentageUsed),
    progressPercentage: clampPercentage(percentageUsed),
    usageLevel,
    progressStatus: getBudgetProgressStatus(usageLevel),
    tagName: budget.tag_name,
    tagColor: budget.tag_color,
    isOverBudget,
  };
};

/**
 * Aggregates finite budget envelope values for summary widgets.
 *
 * @param envelopes Normalized budget envelopes.
 * @returns Summary totals and attention counters.
 */
export const summarizeBudgetEnvelopes = (
  envelopes: readonly BudgetEnvelopeView[],
): BudgetEnvelopeSummary => {
  const totalBudgeted = envelopes.reduce((sum, envelope) => sum + envelope.amount, 0);
  const totalSpent = envelopes.reduce((sum, envelope) => sum + envelope.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0
    ? clampPercentage((totalSpent / totalBudgeted) * 100)
    : 0;

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining,
    overallPercentage,
    warningCount: envelopes.filter((envelope) => envelope.usageLevel === "warning").length,
    dangerCount: envelopes.filter((envelope) => envelope.usageLevel === "danger").length,
  };
};

/**
 * Detects whether a subscription should unlock unlimited budget envelopes.
 *
 * @param subscription Current subscription view model.
 * @returns True for active premium/pro subscriptions.
 */
const isPremiumSubscription = (subscription: Subscription | null | undefined): boolean => {
  if (!subscription || !["active", "trialing"].includes(subscription.status)) {
    return false;
  }

  return ["premium", "pro"].includes(subscription.planSlug);
};

/**
 * Builds the freemium quota state for the budget creation flow.
 *
 * @param input Budget count and current subscription.
 * @param input.budgetCount Current number of budget envelopes.
 * @param input.subscription Current subscription view model.
 * @returns Creation quota and display label.
 */
export const buildBudgetQuotaState = ({
  budgetCount,
  subscription,
}: BudgetQuotaInput): BudgetQuotaState => {
  const used = Math.max(Math.round(finiteNumber(budgetCount)), 0);
  const isPremium = isPremiumSubscription(subscription);

  if (isPremium) {
    return {
      isPremium: true,
      limit: null,
      used,
      remainingSlots: null,
      canCreate: true,
      label: "Premium: envelopes ilimitados",
    };
  }

  const remainingSlots = Math.max(BUDGET_FREE_ENVELOPE_LIMIT - used, 0);

  return {
    isPremium: false,
    limit: BUDGET_FREE_ENVELOPE_LIMIT,
    used,
    remainingSlots,
    canCreate: remainingSlots > 0,
    label: `Plano gratuito: ${Math.min(used, BUDGET_FREE_ENVELOPE_LIMIT)} de ${BUDGET_FREE_ENVELOPE_LIMIT} envelopes`,
  };
};
