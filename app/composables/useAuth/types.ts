import type { UseMutationReturnType } from "@tanstack/vue-query";

import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "~/types/contracts";

export interface HttpAdapter {
  post<TResponse>(url: string, payload?: unknown): Promise<{ data: TResponse }>;
}

export interface AuthApi {
  login(payload: LoginRequest): Promise<LoginResponse>;
  register(payload: RegisterRequest): Promise<RegisterResponse>;
  forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
}

export type LoginMutation = UseMutationReturnType<
  LoginResponse,
  unknown,
  LoginRequest,
  unknown
>;
export type RegisterMutation = UseMutationReturnType<
  RegisterResponse,
  unknown,
  RegisterRequest,
  unknown
>;
export type ForgotPasswordMutation = UseMutationReturnType<
  ForgotPasswordResponse,
  unknown,
  ForgotPasswordRequest,
  unknown
>;
