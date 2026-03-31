import type { AxiosInstance } from "axios";
import { useHttp } from "~/composables/useHttp";

/**
 * Backend envelope for email-related auth operations.
 */
interface AuthEmailResponse {
  readonly success: boolean;
  readonly message?: string;
}

/**
 * API client for email-confirmation auth flows.
 *
 * Handles token-based email confirmation and resend-confirmation requests.
 */
export class AuthEmailClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Confirms the user's email address using the one-time token sent by email.
   *
   * Backend: POST /auth/email/confirm — expects `{ token }` as JSON body.
   *
   * @param token Confirmation token extracted from the URL query param.
   */
  async confirmEmail(token: string): Promise<void> {
    await this.#http.post<AuthEmailResponse>("/auth/email/confirm", { token });
  }

  /**
   * Requests a new confirmation email for the authenticated user.
   *
   * Backend: POST /auth/email/resend
   */
  async resendConfirmation(): Promise<void> {
    await this.#http.post<AuthEmailResponse>("/auth/email/resend");
  }
}

/**
 * Resolves the canonical auth-email client using the shared HTTP layer.
 *
 * @returns AuthEmailClient instance bound to the application HTTP adapter.
 */
export const useAuthEmailClient = (): AuthEmailClient =>
  new AuthEmailClient(useHttp());
