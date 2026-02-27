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
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
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
