/**
 * Data Transfer Objects for the simulation card feature view.
 *
 * These types extend the simulation domain with a typed `type` field
 * and a pre-computed `summary` and `result_value` for display purposes.
 */

export type SimulationType =
  | "installment_vs_cash"
  | "goal_projection"
  | "investment_return";

export type SimulationCardDto = {
  readonly id: string;
  readonly name: string;
  readonly type: SimulationType;
  readonly created_at: string;
  readonly summary: string; // short human-readable result summary
  readonly result_value: number | null; // main result number
};
