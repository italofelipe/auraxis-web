import axios, { type AxiosInstance } from "axios";

import { ApiError } from "~/core/errors";
import { useHttp } from "~/composables/useHttp";
import { toApiError } from "~/core/api";

const DEFAULT_API_BASE = "http://localhost:5000";
export const CONFIRM_EMAIL_TIMEOUT_MS = 15_000;

/**
 * Backend envelope for email-related auth operations that do NOT issue a
 * session (e.g. resend confirmation).
 */
interface AuthEmailResponse {
  readonly success: boolean;
  readonly message?: string;
}

/**
 * Canonical v3 user payload returned by /user/me and by the magic-link
 * confirmation endpoint. Mirrored from
 * `auraxis-api/app/services/authenticated_user_payloads.py`.
 */
export interface ConfirmEmailUserPayload {
  readonly identity: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
  readonly email_verification: {
    readonly verified: boolean;
    readonly deadline_at: string | null;
    readonly required_now: boolean;
    readonly days_remaining: number | null;
  };
  // Other v3 blocks (profile, financial_profile, etc.) are present but
  // unused by the confirm-email login flow; the dashboard will refetch
  // them from /user/me as needed.
}

/**
 * Backend envelope for /auth/email/confirm — magic-link login response.
 *
 * Mirrors `auraxis-api/app/controllers/auth/confirm_email_resource.py`. When
 * the HMAC token is valid, the backend mints an access JWT + sets a refresh
 * cookie, so the frontend can sign the user in transparently (#1338).
 */
interface ConfirmEmailEnvelope {
  readonly success: boolean;
  readonly message: string;
  readonly data?: {
    readonly token?: string;
    readonly user?: ConfirmEmailUserPayload;
    readonly refresh_token?: string | null;
  } | null;
}

/**
 * Normalised confirmation result consumed by the page + session store.
 *
 * Decoupled from the backend wire shape so the page never sees the snake_case
 * keys directly.
 */
export type ConfirmEmailResult =
  | {
      readonly kind: "signed_in";
      readonly message: string;
      readonly token: string;
      readonly user: ConfirmEmailUserPayload;
    }
  | {
      readonly kind: "confirmed_without_session";
      readonly message: string;
    };

interface ConfirmEmailSignedInEnvelope {
  readonly token: string;
  readonly user: ConfirmEmailUserPayload;
}

/**
 * API client for email-confirmation auth flows.
 *
 * The `confirmEmail` call uses an anonymous Axios instance (no Bearer header,
 * no shared interceptors) because the HMAC token in the URL is the credential
 * — leaking a stale or expired session JWT into that request would (a) be
 * pointless and (b) cause the global `Sessão expirada` modal to hijack the UI
 * during a flow that is supposed to be authentication-agnostic.
 */
export class AuthEmailClient {
  readonly #http: AxiosInstance;
  readonly #anonymous: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API
   *   (Bearer + interceptors). Used by `resendConfirmation`.
   * @param anonymous Axios instance with no Bearer / no interceptors.
   *   Used by `confirmEmail` so the magic-link flow stays untouched by the
   *   global session error handling.
   */
  constructor(http: AxiosInstance, anonymous: AxiosInstance) {
    this.#http = http;
    this.#anonymous = anonymous;
  }

  /**
   * Confirms the user's email and (when the token is valid) opens a session.
   *
   * Backend: POST /auth/email/confirm — expects `{ token }` as JSON body.
   * Returns the access JWT + canonical user payload; the refresh cookie is
   * set server-side via `Set-Cookie` (httpOnly).
   *
   * @param token Confirmation token extracted from the URL query param.
   * @returns Access token + canonical user payload for `signIn()`.
   * @throws ApiError when the token is missing, expired or invalid.
   */
  async confirmEmail(token: string): Promise<ConfirmEmailResult> {
    let envelope: ConfirmEmailEnvelope;
    try {
      const response = await this.#anonymous.post<ConfirmEmailEnvelope>(
        "/auth/email/confirm",
        { token },
        {
          headers: { "X-API-Contract": "v2" },
          timeout: CONFIRM_EMAIL_TIMEOUT_MS,
          withCredentials: true,
        },
      );
      envelope = response.data;
    } catch (error) {
      throw toApiError(error);
    }

    const data = envelope?.data;
    if (isSignedInEnvelope(data)) {
      return {
        kind: "signed_in",
        message: envelope.message,
        token: data.token,
        user: data.user,
      };
    }
    if (envelope?.success === true && (data === null || data === undefined)) {
      return {
        kind: "confirmed_without_session",
        message: envelope.message,
      };
    }
    throw new ApiError(
      502,
      "Resposta inesperada do servidor.",
      "UNEXPECTED_CONFIRM_EMAIL_RESPONSE",
    );
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
 * Builds the anonymous Axios instance used by `confirmEmail`.
 *
 * Reads the API base URL from the Nuxt runtime config so the client points at
 * the right backend in every environment.
 *
 * @returns Axios instance scoped to the Auraxis API base URL, with no
 *   interceptors and no Bearer header injection.
 */
const buildAnonymousClient = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);
  return axios.create({ baseURL: apiBase, withCredentials: true });
};

/**
 * Resolves the canonical auth-email client using the shared HTTP layer for
 * authenticated calls and a fresh anonymous client for `confirmEmail`.
 *
 * @returns AuthEmailClient instance.
 */
export const useAuthEmailClient = (): AuthEmailClient =>
  new AuthEmailClient(useHttp(), buildAnonymousClient());

/**
 * Returns true when the confirmation envelope contains a complete magic-link
 * session payload.
 *
 * @param data Optional backend data block.
 * @returns Whether `data` can hydrate the session store safely.
 */
function isSignedInEnvelope(
  data: ConfirmEmailEnvelope["data"],
): data is ConfirmEmailSignedInEnvelope {
  return typeof data?.token === "string" && data.token.length > 0 && data.user !== undefined;
}
