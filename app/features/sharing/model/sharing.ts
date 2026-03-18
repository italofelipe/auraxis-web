/**
 * Domain types for the sharing feature.
 *
 * These camelCase types are used by all UI components and composables.
 * They are derived from the raw API DTOs via `sharing.mapper.ts`.
 */

export type SharePermission = "read" | "write";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface SharedEntry {
  readonly id: string;
  readonly entryId: string;
  readonly entryType: string;
  readonly sharedWithId: string;
  readonly permission: SharePermission;
  readonly createdAt: string;
  readonly revokedAt: string | null;
}

export interface Invitation {
  readonly id: string;
  readonly inviteeEmail: string;
  readonly token: string;
  readonly status: InvitationStatus;
  readonly expiresAt: string;
  readonly acceptedAt: string | null;
  readonly createdAt: string;
}

export interface CreateSharedEntryParams {
  readonly entryId: string;
  readonly entryType: string;
  readonly sharedWithId: string;
  readonly permission: SharePermission;
}

export interface CreateInvitationParams {
  readonly inviteeEmail: string;
  readonly expiresInHours?: number;
}
