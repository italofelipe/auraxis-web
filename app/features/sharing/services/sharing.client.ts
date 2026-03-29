import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { CreateInvitationDto, CreateSharedEntryDto, InvitationDto, SharedEntryDto } from "~/features/sharing/contracts/sharing.dto";
import { mapInvitationDto, mapSharedEntryDto } from "~/features/sharing/services/sharing.mapper";
import type { CreateInvitationParams, CreateSharedEntryParams, Invitation, SharedEntry } from "~/features/sharing/model/sharing";

/**
 * API client for the sharing feature.
 *
 * Encapsulates all HTTP calls to the `/shared-entries` and `/invitations`
 * endpoints and returns mapped domain types ready for UI consumption.
 */
export class SharingClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Creates a new shared entry.
   *
   * @param params Parameters for creating a shared entry.
   * @returns Mapped SharedEntry domain type.
   */
  async createSharedEntry(params: CreateSharedEntryParams): Promise<SharedEntry> {
    const body: CreateSharedEntryDto = {
      entry_id: params.entryId,
      entry_type: params.entryType,
      shared_with_id: params.sharedWithId,
      permission: params.permission,
    };
    const response = await this.#http.post<SharedEntryDto>("/shared-entries", body);
    return mapSharedEntryDto(response.data);
  }

  /**
   * Fetches the list of entries shared by the authenticated user.
   *
   * @returns List of SharedEntry domain types.
   */
  async getSharedByMe(): Promise<SharedEntry[]> {
    const response = await this.#http.get<SharedEntryDto[]>("/shared-entries/by-me");
    return response.data.map(mapSharedEntryDto);
  }

  /**
   * Fetches the list of entries shared with the authenticated user.
   *
   * @returns List of SharedEntry domain types.
   */
  async getSharedWithMe(): Promise<SharedEntry[]> {
    const response = await this.#http.get<SharedEntryDto[]>("/shared-entries/with-me");
    return response.data.map(mapSharedEntryDto);
  }

  /**
   * Revokes a shared entry by ID.
   *
   * @param id The shared entry ID to revoke.
   */
  async revokeSharedEntry(id: string): Promise<void> {
    await this.#http.delete(`/shared-entries/${id}`);
  }

  /**
   * Creates a new invitation.
   *
   * @param params Parameters for creating an invitation.
   * @returns Mapped Invitation domain type.
   */
  async createInvitation(params: CreateInvitationParams): Promise<Invitation> {
    const body: CreateInvitationDto = {
      invitee_email: params.inviteeEmail,
      expires_in_hours: params.expiresInHours,
    };
    const response = await this.#http.post<InvitationDto>("/invitations", body);
    return mapInvitationDto(response.data);
  }

  /**
   * Fetches the list of invitations created by the authenticated user.
   *
   * @returns List of Invitation domain types.
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await this.#http.get<InvitationDto[]>("/invitations");
    return response.data.map(mapInvitationDto);
  }

  /**
   * Accepts an invitation by token.
   *
   * @param token The invitation token to accept.
   * @returns Mapped Invitation domain type.
   */
  async acceptInvitation(token: string): Promise<Invitation> {
    const response = await this.#http.post<InvitationDto>(`/invitations/${token}/accept`);
    return mapInvitationDto(response.data);
  }

  /**
   * Revokes an invitation by ID.
   *
   * @param id The invitation ID to revoke.
   */
  async revokeInvitation(id: string): Promise<void> {
    await this.#http.delete(`/invitations/${id}`);
  }
}

/**
 * Resolves the canonical sharing API client using the shared HTTP layer.
 *
 * @returns SharingClient instance bound to the application HTTP adapter.
 */
export const useSharingClient = (): SharingClient => {
  return new SharingClient(useHttp());
};
