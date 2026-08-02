export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  /** Cloudflare Turnstile token — null when the site key is not configured (dev mode). */
  readonly captchaToken?: string | null;
}

export interface LoginResponse {
  readonly accessToken: string;
  /** Opaque token used to obtain new access tokens without re-authenticating. */
  readonly refreshToken?: string;
  readonly user: {
    readonly email: string;
    readonly displayName: string;
    /** Whether the user's email address has been confirmed. */
    readonly emailConfirmed?: boolean;
    /** Backend-provided deadline for mandatory email confirmation. */
    readonly emailConfirmationDeadlineAt?: string | null;
    /** Whether the backend has blocked access until email confirmation. */
    readonly emailConfirmationBlocked?: boolean;
  };
}

export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  /** Cloudflare Turnstile token — null when the site key is not configured (dev mode). */
  readonly captchaToken?: string | null;
}

export interface RegisterResponse {
  readonly message: string;
  readonly user?: {
    readonly email: string;
    readonly displayName: string;
    /** Whether the user's email address has been confirmed. Always false for new registrations. */
    readonly emailConfirmed?: boolean;
    /** Backend-provided deadline for mandatory email confirmation. */
    readonly emailConfirmationDeadlineAt?: string | null;
    /** Whether the backend has blocked access until email confirmation. */
    readonly emailConfirmationBlocked?: boolean;
  };
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ForgotPasswordResponse {
  readonly accepted: boolean;
  readonly message: string;
}

export interface ResetPasswordRequest {
  readonly token: string;
  /**
   * The new password, in the camelCase domain shape used across this contract.
   *
   * The API expects `new_password` on the wire — `toResetPasswordWirePayload`
   * in `composables/useAuth/api.ts` does that translation against the generated
   * OpenAPI type, so a backend rename surfaces as a typecheck failure instead
   * of a production incident (#1301).
   */
  readonly newPassword: string;
}

export interface ResetPasswordResponse {
  readonly message: string;
}
