import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { SharedEntryDto } from "~/features/shared-entries/contracts/shared-entry.dto";

/**
 * API client for the shared-entries feature.
 *
 * Encapsulates all HTTP calls to the `/shared-entries` endpoints and returns
 * SharedEntryDto objects ready for UI consumption via the SharedEntryRow component.
 */
export class SharedEntriesClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches entries shared by the authenticated user.
   *
   * @returns Array of SharedEntryDto objects.
   */
  async getSharedByMe(): Promise<SharedEntryDto[]> {
    const response = await this.#http.get<SharedEntryDto[]>("/shared-entries/by-me");
    return response.data;
  }

  /**
   * Fetches entries shared with the authenticated user by others.
   *
   * @returns Array of SharedEntryDto objects.
   */
  async getSharedWithMe(): Promise<SharedEntryDto[]> {
    const response = await this.#http.get<SharedEntryDto[]>("/shared-entries/with-me");
    return response.data;
  }

  /**
   * Revokes a shared entry by id.
   *
   * @param id The shared entry id to revoke.
   */
  async revokeSharedEntry(id: string): Promise<void> {
    await this.#http.delete(`/shared-entries/${id}`);
  }
}

/**
 * Resolves the canonical shared-entries API client using the shared HTTP layer.
 *
 * @returns SharedEntriesClient instance bound to the application HTTP adapter.
 */
export const useSharedEntriesClient = (): SharedEntriesClient => {
  return new SharedEntriesClient(useHttp());
};
