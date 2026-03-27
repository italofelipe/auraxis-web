/**
 * Data Transfer Objects for the alerts feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 */

export type AlertType =
  | "goal_achieved"
  | "overdue_payment"
  | "budget_exceeded"
  | "investment_opportunity"
  | "system";

export type AlertDto = {
  readonly id: string;
  readonly type: AlertType;
  readonly title: string;
  readonly description: string;
  readonly created_at: string; // ISO
  readonly is_read: boolean;
};
