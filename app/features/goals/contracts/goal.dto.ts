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
