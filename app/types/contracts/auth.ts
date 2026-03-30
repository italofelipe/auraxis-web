export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly user: {
    readonly email: string;
    readonly displayName: string;
  };
}

export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  /** reCAPTCHA v3 token — null when the site key is not configured (dev mode). */
  readonly captchaToken?: string | null;
}

export interface RegisterResponse {
  readonly accessToken: string;
  readonly user: {
    readonly email: string;
    readonly displayName: string;
  };
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ForgotPasswordResponse {
  readonly accepted: boolean;
  readonly message: string;
}
