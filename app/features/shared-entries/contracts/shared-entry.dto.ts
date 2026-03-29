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
  readonly owner_id: string;
  readonly transaction_id: string;
  readonly transaction_title: string;
  readonly transaction_amount: number;
  readonly my_share: number;
  readonly other_party_email: string;
  readonly split_type: SplitType;
  readonly status: "pending" | "accepted" | "declined";
  readonly created_at: string;
  readonly updated_at: string;
};

/**
 * Response envelope returned by all shared-entry list endpoints.
 *
 * @example
 * { success: true, message: "...", data: { shared_entries: [...] } }
 */
export type SharedEntriesListResponseEnvelope = {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly shared_entries: SharedEntryDto[];
  };
};
