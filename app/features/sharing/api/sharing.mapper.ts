import type { InvitationDto, SharedEntryDto } from "~/features/sharing/contracts/sharing.dto";
import type { Invitation, InvitationStatus, SharePermission, SharedEntry } from "~/features/sharing/model/sharing";

/**
 * Maps a raw shared entry DTO from the API into the internal SharedEntry domain type.
 *
 * @param dto Raw shared entry payload from the API (snake_case).
 * @returns Mapped SharedEntry domain type (camelCase).
 */
export const mapSharedEntryDto = (dto: SharedEntryDto): SharedEntry => {
  return {
    id: dto.id,
    entryId: dto.entry_id,
    entryType: dto.entry_type,
    sharedWithId: dto.shared_with_id,
    permission: dto.permission as SharePermission,
    createdAt: dto.created_at,
    revokedAt: dto.revoked_at,
  };
};

/**
 * Maps a raw invitation DTO from the API into the internal Invitation domain type.
 *
 * @param dto Raw invitation payload from the API (snake_case).
 * @returns Mapped Invitation domain type (camelCase).
 */
export const mapInvitationDto = (dto: InvitationDto): Invitation => {
  return {
    id: dto.id,
    inviteeEmail: dto.invitee_email,
    token: dto.token,
    status: dto.status as InvitationStatus,
    expiresAt: dto.expires_at,
    acceptedAt: dto.accepted_at,
    createdAt: dto.created_at,
  };
};
