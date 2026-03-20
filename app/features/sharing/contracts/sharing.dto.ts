/**
 * Data Transfer Objects for the sharing feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to domain types before reaching
 * UI components.
 */

export interface SharedEntryDto {
  readonly id: string;
  readonly entry_id: string;
  readonly entry_type: string;
  readonly shared_with_id: string;
  readonly permission: string;
  readonly created_at: string;
  readonly revoked_at: string | null;
}

export interface InvitationDto {
  readonly id: string;
  readonly invitee_email: string;
  readonly token: string;
  readonly status: string;
  readonly expires_at: string;
  readonly accepted_at: string | null;
  readonly created_at: string;
}

export interface CreateSharedEntryDto {
  readonly entry_id: string;
  readonly entry_type: string;
  readonly shared_with_id: string;
  readonly permission: string;
}

export interface CreateInvitationDto {
  readonly invitee_email: string;
  readonly expires_in_hours?: number;
}
