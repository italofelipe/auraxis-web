import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "~/types/contracts";

import type { AuthApi, HttpAdapter } from "./types";

/** v2 envelope user object returned by auth endpoints. */
type V2AuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  /** Whether the user's email address has been verified. */
  readonly email_confirmed?: boolean;
  /** Backend deadline for mandatory email confirmation. */
  readonly email_confirmation_deadline_at?: string | null;
  /** Whether backend access is blocked until email confirmation. */
  readonly email_confirmation_blocked?: boolean;
};

/** v2 envelope data payload for login. */
type V2LoginData = {
  readonly token: string;
  /** Refresh token returned since B18. Absent on older API versions. */
  readonly refresh_token?: string;
  readonly user: V2AuthUser;
};

/** Full v2/v3 standardized envelope for login endpoints. */
type V2LoginEnvelope = {
  readonly success: boolean;
  readonly message: string;
  readonly data: V2LoginData;
};

/** v2 envelope data payload for registration. */
type V2RegisterData = {
  readonly user?: V2AuthUser;
};

/** Full v2/v3 standardized envelope for registration. */
type V2RegisterEnvelope = {
  readonly success: boolean;
  readonly message: string;
  readonly data?: V2RegisterData;
};

type ForgotPasswordLegacyResponse = {
  readonly message: string;
};

type ForgotPasswordWireResponse =
  | ForgotPasswordResponse
  | ForgotPasswordLegacyResponse;

/**
 * Maps v2 envelope auth data to the canonical LoginResponse contract.
 *
 * @param envelope V2 auth response envelope.
 * @returns Normalized LoginResponse.
 */
const normalizeAuthEnvelope = (envelope: V2LoginEnvelope): LoginResponse => ({
  accessToken: envelope.data.token,
  refreshToken: envelope.data.refresh_token,
  user: {
    email: envelope.data.user.email,
    displayName: envelope.data.user.name,
    emailConfirmed: envelope.data.user.email_confirmed,
    emailConfirmationDeadlineAt: envelope.data.user.email_confirmation_deadline_at ?? null,
    emailConfirmationBlocked: envelope.data.user.email_confirmation_blocked ?? false,
  },
});

/**
 * Maps v2 registration envelope data to the canonical RegisterResponse.
 *
 * Registration does not create a frontend session. The page must call login
 * with the submitted credentials after this response to obtain tokens.
 *
 * @param envelope V2 registration response envelope.
 * @returns Normalized RegisterResponse.
 */
const normalizeRegisterEnvelope = (
  envelope: V2RegisterEnvelope,
): RegisterResponse => ({
  message: envelope.message,
  user: envelope.data?.user
    ? {
        email: envelope.data.user.email,
        displayName: envelope.data.user.name,
        emailConfirmed: envelope.data.user.email_confirmed,
        emailConfirmationDeadlineAt: envelope.data.user.email_confirmation_deadline_at ?? null,
        emailConfirmationBlocked: envelope.data.user.email_confirmation_blocked ?? false,
      }
    : undefined,
});

/**
 * Normalizes the forgot-password wire response to the frontend contract.
 *
 * @param payload Legacy or normalized forgot-password response.
 * @returns Normalized ForgotPasswordResponse.
 */
const normalizeForgotPasswordResponse = (
  payload: ForgotPasswordWireResponse,
): ForgotPasswordResponse => {
  return {
    accepted: "accepted" in payload ? payload.accepted : true,
    message: payload.message,
  };
};

/**
 * Creates the authentication API adapter from an HTTP client.
 *
 * @param http HTTP adapter with a post method.
 * @returns Auth API with login, register and forgotPassword methods.
 */
export const createAuthApi = (http: HttpAdapter): AuthApi => {
  return {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
      const response = await http.post<V2LoginEnvelope>("/auth/login", payload);
      return normalizeAuthEnvelope(response.data);
    },
    register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
      const response = await http.post<V2RegisterEnvelope>(
        "/auth/register",
        payload,
      );
      return normalizeRegisterEnvelope(response.data);
    },
    forgotPassword: async (
      payload: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      const response = await http.post<ForgotPasswordWireResponse>(
        "/auth/password/forgot",
        payload,
      );
      return normalizeForgotPasswordResponse(response.data);
    },
    resetPassword: async (
      payload: ResetPasswordRequest,
    ): Promise<ResetPasswordResponse> => {
      const response = await http.post<ResetPasswordResponse>(
        "/auth/password/reset",
        payload,
      );
      return response.data;
    },
  };
};
