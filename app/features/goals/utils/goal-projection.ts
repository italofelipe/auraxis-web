/**
 * Local compound-interest projection helpers for the goal sandbox.
 *
 * These are pure functions so the sandbox can render projections in real time
 * without blocking on server roundtrips — the API still owns the canonical
 * calculation when the user saves the scenario via `useUpdateGoalMutation`.
 */

export interface GoalProjectionScenarioInput {
  /** Current balance already accumulated toward the goal. */
  readonly currentAmount: number;
  /** Target amount to reach. */
  readonly targetAmount: number;
  /** Monthly contribution in BRL. */
  readonly monthlyContribution: number;
  /** Expected annual return rate, expressed as a percentage (e.g. `8` for 8%). */
  readonly annualReturnRatePct: number;
  /** Horizon in months (how far to project). */
  readonly horizonMonths: number;
}

export interface GoalProjectionPoint {
  readonly month: number;
  readonly balance: number;
}

export interface GoalProjectionScenario {
  readonly points: readonly GoalProjectionPoint[];
  /** Final projected balance at the end of the horizon. */
  readonly finalBalance: number;
  /** First month (1-indexed) in which balance reaches `targetAmount`; `null` when never within horizon. */
  readonly monthsToTarget: number | null;
  /** Remaining gap at the end of the horizon (max 0 when target is met). */
  readonly remainingGap: number;
}

const MONTHS_IN_YEAR = 12;

/**
 * Projects the monthly balance of a goal using compound interest with a
 * fixed monthly contribution, under a constant expected annual return.
 *
 * @param input - Scenario parameters.
 * @returns The monthly trajectory plus derived metrics.
 */
export const projectGoalScenario = (
  input: GoalProjectionScenarioInput,
): GoalProjectionScenario => {
  const monthlyRate = input.annualReturnRatePct / 100 / MONTHS_IN_YEAR;
  const horizon = Math.max(1, Math.min(600, Math.floor(input.horizonMonths)));

  const points: GoalProjectionPoint[] = [];
  let balance = Math.max(0, input.currentAmount);
  let monthsToTarget: number | null = balance >= input.targetAmount ? 0 : null;

  for (let month = 1; month <= horizon; month++) {
    balance = balance * (1 + monthlyRate) + Math.max(0, input.monthlyContribution);
    points.push({ month, balance });
    if (monthsToTarget === null && balance >= input.targetAmount) {
      monthsToTarget = month;
    }
  }

  const finalBalance = points[points.length - 1]?.balance ?? balance;
  const remainingGap = Math.max(0, input.targetAmount - finalBalance);

  return { points, finalBalance, monthsToTarget, remainingGap };
};

/**
 * Calculates a projected completion date given the current date and the number
 * of months the scenario needs to hit target.
 *
 * @param monthsToTarget - Months until target is reached.
 * @param reference - Base date (defaults to now).
 * @returns ISO date (`YYYY-MM-DD`) or null when the scenario never reaches target.
 */
export const projectedCompletionDate = (
  monthsToTarget: number | null,
  reference: Date = new Date(),
): string | null => {
  if (monthsToTarget === null) { return null; }
  const next = new Date(reference);
  next.setMonth(next.getMonth() + monthsToTarget);
  return next.toISOString().slice(0, 10);
};
