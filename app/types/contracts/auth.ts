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
  readonly accessToken: string;
  /** Opaque token used to obtain new access tokens without re-authenticating. */
  readonly refreshToken?: string;
  readonly user: {
    readonly email: string;
    readonly displayName: string;
    /** Whether the user's email address has been confirmed. Always false for new registrations. */
    readonly emailConfirmed?: boolean;
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
  readonly password: string;
}

export interface ResetPasswordResponse {
  readonly message: string;
}
