/**
 * Data Transfer Objects for the shared-entries feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 */

export type SplitType = "equal" | "custom" | "percentage";

export type SharedEntryDto = {
  readonly id: string;
  readonly transaction_id: string;
  readonly transaction_title: string;
  readonly transaction_amount: number;
  readonly split_type: SplitType;
  readonly my_share: number;
  readonly other_party_email: string;
  readonly created_at: string;
  readonly status: "pending" | "accepted" | "declined";
};
