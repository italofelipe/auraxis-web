import type { AxiosInstance } from "axios";
import { useHttp } from "~/composables/useHttp";

/**
 * Backend response envelope for account deletion.
 */
interface DeleteAccountResponse {
  readonly success: boolean;
  readonly message?: string;
}

/**
 * API client for user account management operations.
 *
 * Handles account deletion with LGPD compliance.
 */
export class UserAccountClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Permanently deletes (anonymises) the authenticated user's account.
   *
   * Backend: DELETE /user/me — expects `{ password }` as JSON body.
   * Requires a valid Bearer token in the Authorization header.
   *
   * @param password The user's current password used for identity confirmation.
   */
  async deleteAccount(password: string): Promise<void> {
    await this.#http.delete<DeleteAccountResponse>("/user/me", {
      data: { password },
    });
  }
}

/**
 * Resolves the canonical user-account client using the shared HTTP layer.
 *
 * @returns UserAccountClient instance bound to the application HTTP adapter.
 */
export const useUserAccountClient = (): UserAccountClient =>
  new UserAccountClient(useHttp());
