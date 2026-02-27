import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "~/types/contracts";

import type { AuthApi, HttpAdapter } from "./types";

/**
 * Cria adapter de autenticação baseado no cliente HTTP.
 * @param http Cliente HTTP com método POST.
 * @returns API de autenticação.
 */
export const createAuthApi = (http: HttpAdapter): AuthApi => {
  return {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
      const response = await http.post<LoginResponse>("/auth/login", payload);
      return response.data;
    },
    register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
      const response = await http.post<RegisterResponse>("/auth/register", payload);
      return response.data;
    },
    forgotPassword: async (
      payload: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      const response = await http.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        payload,
      );
      return response.data;
    },
  };
};
