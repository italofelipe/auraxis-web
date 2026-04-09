export type GoalStatus = "active" | "completed" | "paused" | "cancelled";

export type GoalDto = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly target_amount: number;
  readonly current_amount: number;
  readonly target_date: string; // YYYY-MM-DD
  readonly status: GoalStatus;
  readonly created_at: string;
};

export type GoalPlanDto = {
  readonly required_monthly_contribution: number;
  readonly months_remaining: number;
  readonly projected_completion_date: string;
  readonly is_on_track: boolean;
};

export type CreateGoalPayload = {
  readonly name: string;
  readonly description?: string | null;
  readonly target_amount: number;
  readonly current_amount?: number;
  readonly target_date?: string | null; // YYYY-MM-DD
  readonly status?: GoalStatus;
};

export type UpdateGoalPayload = Partial<CreateGoalPayload>;

/**
 * Compound-interest projection for a single goal.
 * Mirrors the API response from GET /goals/:id/projection.
 */
export type GoalProjectionDto = {
  /** UUID of the goal. */
  readonly goal_id: string;
  /** Current saved amount (decimal string). */
  readonly current_amount: string;
  /** Target amount (decimal string). */
  readonly target_amount: string;
  /** Remaining amount to reach target (decimal string). */
  readonly remaining_amount: string;
  /** Monthly contribution used for the projection (decimal string). */
  readonly monthly_contribution: string;
  /** Portfolio blended monthly return rate (decimal string, e.g. "0.009489"). */
  readonly portfolio_monthly_return_rate: string;
  /** Annualised return rate as a percentage (decimal string, e.g. "12.00"). */
  readonly portfolio_annual_return_rate_pct: string;
  /** Number of months until the goal is reached, or null if unreachable. */
  readonly months_to_completion: number | null;
  /** ISO date string of projected completion, or null if unreachable. */
  readonly projected_completion_date: string | null;
  /** Whether the user is on track to meet the goal before the deadline. */
  readonly on_track: boolean;
  /** Months remaining until the goal deadline, or null if no deadline. */
  readonly months_until_deadline: number | null;
  /** Suggested monthly contribution to meet the deadline, or null if no deadline. */
  readonly suggested_monthly_contribution: string | null;
};

/**
 * Full response from GET /goals/:id/projection.
 */
export type GoalProjectionResponseDto = {
  readonly goal: GoalDto;
  readonly projection: GoalProjectionDto;
};
