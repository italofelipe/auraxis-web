/**
 * A single contribution (deposit or withdrawal) recorded against a goal.
 *
 * Mirrors the API response from POST/GET /goals/:id/contributions. The wire
 * format serialises `amount` as a signed decimal string; the UI contract uses
 * a signed `number` (positive for deposits, negative for withdrawals).
 */
export type GoalContributionDto = {
  /** UUID of the contribution. */
  readonly id: string;
  /** UUID of the parent goal. */
  readonly goal_id: string;
  /** Signed amount: positive for a deposit, negative for a withdrawal. */
  readonly amount: number;
  /** Optional free-form note (≤200 chars), or null when absent. */
  readonly note: string | null;
  /** Date the contribution occurred (YYYY-MM-DD). */
  readonly occurred_at: string;
  /** ISO timestamp of when the contribution was created. */
  readonly created_at: string;
};

/**
 * Payload sent to POST /goals/:id/contributions.
 *
 * `amount` is a signed UI number; the client serialises it to a decimal string
 * before sending it over the wire.
 */
export type RecordGoalContributionPayload = {
  /** Signed amount: positive for a deposit, negative for a withdrawal. */
  readonly amount: number;
  /** Date the contribution occurred (YYYY-MM-DD). Defaults server-side to today. */
  readonly occurred_at?: string;
  /** Optional free-form note (≤200 chars). */
  readonly note?: string;
};

/**
 * Pagination metadata returned by the paginated contributions list endpoint.
 */
export type ContributionPagination = {
  /** Total number of contributions for the goal. */
  readonly total: number;
  /** Current page (1-based). */
  readonly page: number;
  /** Number of items per page. */
  readonly per_page: number;
  /** Total number of pages. */
  readonly pages: number;
};

/**
 * Result of GET /goals/:id/contributions, unwrapped to the UI contract.
 */
export type GoalContributionListDto = {
  /** Contributions ordered newest first. */
  readonly items: GoalContributionDto[];
  /** Pagination metadata. */
  readonly pagination: ContributionPagination;
};
