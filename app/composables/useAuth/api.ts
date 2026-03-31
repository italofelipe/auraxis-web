import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "~/types/contracts";

import type { AuthApi, HttpAdapter } from "./types";

/** v2 envelope user object returned by auth endpoints. */
type V2AuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  /** Whether the user's email address has been verified. */
  readonly email_confirmed?: boolean;
};

/** v2 envelope data payload for login and register. */
type V2AuthData = {
  readonly token: string;
  readonly user: V2AuthUser;
};

/** Full v2/v3 standardized envelope for auth endpoints. */
type V2AuthEnvelope = {
  readonly success: boolean;
  readonly message: string;
  readonly data: V2AuthData;
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
const normalizeAuthEnvelope = (envelope: V2AuthEnvelope): LoginResponse => ({
  accessToken: envelope.data.token,
  user: {
    email: envelope.data.user.email,
    displayName: envelope.data.user.name,
    emailConfirmed: envelope.data.user.email_confirmed,
  },
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
      const response = await http.post<V2AuthEnvelope>("/auth/login", payload);
      return normalizeAuthEnvelope(response.data);
    },
    register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
      const response = await http.post<V2AuthEnvelope>("/auth/register", payload);
      return normalizeAuthEnvelope(response.data);
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
  };
};
