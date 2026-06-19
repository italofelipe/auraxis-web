import type { GoalDto } from "~/features/goals/contracts/goal.dto";

export type GoalHubTone =
  | "achieved"
  | "danger"
  | "warning"
  | "healthy"
  | "paused"
  | "completed"
  | "cancelled";

export type GoalHubProgressStatus = "success" | "error" | "warning" | "default";

export interface GoalHubItem {
  readonly raw: GoalDto;
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly remainingAmount: number;
  readonly progress: number;
  readonly progressPercentage: number;
  readonly targetDate: string | null;
  readonly daysUntilTarget: number | null;
  readonly monthsUntilTarget: number | null;
  readonly requiredMonthlyContribution: number;
  readonly statusLabel: string;
  readonly tone: GoalHubTone;
  readonly progressStatus: GoalHubProgressStatus;
  readonly isReached: boolean;
  readonly isActionable: boolean;
  readonly priorityRank: number;
}

export interface GoalHubSummary {
  readonly activeCount: number;
  readonly totalCurrent: number;
  readonly totalTarget: number;
  readonly totalRemaining: number;
  readonly overallProgress: number;
  readonly reachedCount: number;
  readonly attentionCount: number;
}

interface GoalStatusContext {
  readonly goal: GoalDto;
  readonly progress: number;
  readonly daysUntilTarget: number | null;
  readonly isReached: boolean;
}

/**
 * Converts a numeric-like value into a finite non-negative money amount.
 *
 * @param value Raw amount.
 * @returns Safe amount.
 */
const safeAmount = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(value, 0);
};

/**
 * Clamps a percentage for progress widgets.
 *
 * @param value Raw percentage.
 * @returns Integer percentage between 0 and 100.
 */
const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
};

/**
 * Normalizes a date-only string to local midnight.
 *
 * @param value Date-only value.
 * @returns Local date or null.
 */
const toLocalDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
};

/**
 * Returns the start of the given day.
 *
 * @param value Date value.
 * @returns Date at local midnight.
 */
const startOfDay = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Counts whole calendar month boundaries between two dates.
 *
 * @param from Start date.
 * @param to Target date.
 * @returns At least one month for future dates, null for missing/past dates.
 */
const monthsUntil = (from: Date, to: Date | null): number | null => {
  if (!to || to.getTime() < startOfDay(from).getTime()) {
    return null;
  }

  const monthDelta =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());

  return Math.max(monthDelta, 1);
};

/**
 * Counts days until the target date.
 *
 * @param from Start date.
 * @param to Target date.
 * @returns Signed day count, or null for missing target.
 */
const daysUntil = (from: Date, to: Date | null): number | null => {
  if (!to) {
    return null;
  }

  const msPerDay = 86_400_000;
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
};

/**
 * Resolves the product status shown in the goals hub.
 *
 * @param context Goal status context.
 * @returns Visual status metadata.
 */
const resolveStatus = (
  context: GoalStatusContext,
): Pick<GoalHubItem, "statusLabel" | "tone" | "progressStatus" | "priorityRank"> => {
  const { goal, progress, daysUntilTarget, isReached } = context;

  if (goal.status === "completed") {
    return {
      statusLabel: "Concluída",
      tone: "completed",
      progressStatus: "success",
      priorityRank: 90,
    };
  }

  if (goal.status === "cancelled") {
    return {
      statusLabel: "Cancelada",
      tone: "cancelled",
      progressStatus: "default",
      priorityRank: 100,
    };
  }

  if (isReached) {
    return {
      statusLabel: "Meta alcançada",
      tone: "achieved",
      progressStatus: "success",
      priorityRank: 0,
    };
  }

  if (goal.status === "paused") {
    return {
      statusLabel: "Pausada",
      tone: "paused",
      progressStatus: "default",
      priorityRank: 80,
    };
  }

  if (typeof daysUntilTarget === "number" && daysUntilTarget < 0) {
    return {
      statusLabel: "Atrasada",
      tone: "danger",
      progressStatus: "error",
      priorityRank: 10,
    };
  }

  if (typeof daysUntilTarget === "number" && daysUntilTarget <= 45 && progress < 90) {
    return {
      statusLabel: "Em risco",
      tone: "warning",
      progressStatus: "warning",
      priorityRank: 20,
    };
  }

  return {
    statusLabel: "Em dia",
    tone: "healthy",
    progressStatus: "default",
    priorityRank: 40,
  };
};

/**
 * Normalizes a goal into a hub item safe for summary widgets and selected panels.
 *
 * @param goal Raw goal DTO.
 * @param today Date used for deadline calculations.
 * @returns Hub view model.
 */
export const normalizeGoalHubItem = (
  goal: GoalDto,
  today: Date = new Date(),
): GoalHubItem => {
  const targetAmount = safeAmount(goal.target_amount);
  const currentAmount = safeAmount(goal.current_amount);
  const progress = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;
  const progressPercentage = clampProgress(progress);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const targetDate = toLocalDate(goal.target_date);
  const days = daysUntil(today, targetDate);
  const months = monthsUntil(today, targetDate);
  const isReached = goal.status !== "completed" && targetAmount > 0 && currentAmount >= targetAmount;
  const status = resolveStatus({
    daysUntilTarget: days,
    goal,
    isReached,
    progress,
  });
  const requiredMonthlyContribution =
    remainingAmount > 0 && months ? Math.ceil(remainingAmount / months) : 0;

  return {
    raw: goal,
    id: goal.id,
    name: goal.name,
    description: goal.description,
    targetAmount,
    currentAmount,
    remainingAmount,
    progress,
    progressPercentage,
    targetDate: goal.target_date ?? null,
    daysUntilTarget: days,
    monthsUntilTarget: months,
    requiredMonthlyContribution,
    isReached,
    isActionable: goal.status === "active" || isReached,
    ...status,
  };
};

/**
 * Sorts goals by product action priority for the hub list.
 *
 * @param goals Hub items.
 * @returns Sorted copy.
 */
export const sortGoalHubItems = (
  goals: readonly GoalHubItem[],
): GoalHubItem[] =>
  [...goals].sort((left, right) => {
    const priorityDelta = left.priorityRank - right.priorityRank;
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const dateDelta = (left.daysUntilTarget ?? Number.MAX_SAFE_INTEGER) -
      (right.daysUntilTarget ?? Number.MAX_SAFE_INTEGER);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return right.remainingAmount - left.remainingAmount;
  });

/**
 * Picks the first goal that deserves attention in the hub.
 *
 * @param goals Hub items.
 * @returns Default selected item, or null for an empty list.
 */
export const pickDefaultGoalHubItem = (
  goals: readonly GoalHubItem[],
): GoalHubItem | null => sortGoalHubItems(goals)[0] ?? null;

/**
 * Aggregates active goal totals for the executive summary.
 *
 * @param goals Hub items.
 * @returns Summary values for the goals hub.
 */
export const buildGoalHubSummary = (
  goals: readonly GoalHubItem[],
): GoalHubSummary => {
  const activeGoals = goals.filter((goal) => goal.raw.status === "active");
  const totalCurrent = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalRemaining = Math.max(totalTarget - totalCurrent, 0);

  return {
    activeCount: activeGoals.length,
    totalCurrent,
    totalTarget,
    totalRemaining,
    overallProgress: totalTarget > 0 ? clampProgress((totalCurrent / totalTarget) * 100) : 0,
    reachedCount: activeGoals.filter((goal) => goal.isReached).length,
    attentionCount: activeGoals.filter((goal) =>
      goal.tone === "danger" || goal.tone === "warning",
    ).length,
  };
};
