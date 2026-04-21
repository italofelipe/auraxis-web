import { useMutation } from "@tanstack/vue-query";

import type {
  LoginResponse,
  RegisterResponse,
} from "~/types/contracts";
import { useAnalytics } from "~/composables/useAnalytics";
import { useHttp } from "~/composables/useHttp";
import { useSessionStore } from "~/stores/session";

import { createAuthApi } from "./api";
import type {
  AuthApi,
  ForgotPasswordMutation,
  LoginMutation,
  RegisterMutation,
  ResetPasswordMutation,
} from "./types";

/**
 * Resolve instância da API de autenticação para uso em mutations.
 * @param providedAuthApi API opcional recebida por injeção de dependência.
 * @returns API pronta para uso.
 */
const resolveAuthApi = (providedAuthApi?: AuthApi): AuthApi => {
  if (providedAuthApi) {
    return providedAuthApi;
  }

  return createAuthApi(useHttp());
};

/**
 * Cria mutation de login com sincronização da sessão local.
 * @param authApi API de autenticação opcional para injeção em testes.
 * @returns Mutation de login.
 */
export const useLoginMutation = (authApi?: AuthApi): LoginMutation => {
  const sessionStore = useSessionStore();
  const analytics = useAnalytics();
  const resolvedAuthApi = resolveAuthApi(authApi);

  return useMutation({
    mutationFn: resolvedAuthApi.login,
    onSuccess: (response: LoginResponse): void => {
      sessionStore.signIn({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? null,
        userEmail: response.user.email,
        emailConfirmed: response.user.emailConfirmed,
      });
      analytics.identify(response.user.email);
      analytics.capture("user_signed_in", {
        email_confirmed: response.user.emailConfirmed,
      });
    },
  });
};

/**
 * Cria mutation de registro com sincronização da sessão local.
 * @param authApi API de autenticação opcional para injeção em testes.
 * @returns Mutation de registro.
 */
export const useRegisterMutation = (authApi?: AuthApi): RegisterMutation => {
  const sessionStore = useSessionStore();
  const analytics = useAnalytics();
  const resolvedAuthApi = resolveAuthApi(authApi);

  return useMutation({
    mutationFn: resolvedAuthApi.register,
    onSuccess: (response: RegisterResponse): void => {
      sessionStore.signIn({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? null,
        userEmail: response.user.email,
        emailConfirmed: response.user.emailConfirmed,
      });
      analytics.identify(response.user.email);
      analytics.capture("user_registered", {
        email_confirmed: response.user.emailConfirmed,
      });
    },
  });
};

/**
 * Cria mutation de solicitação de recuperação de senha.
 * @param authApi API de autenticação opcional para injeção em testes.
 * @returns Mutation de recuperação de senha.
 */
export const useForgotPasswordMutation = (
  authApi?: AuthApi,
): ForgotPasswordMutation => {
  const resolvedAuthApi = resolveAuthApi(authApi);

  return useMutation({
    mutationFn: resolvedAuthApi.forgotPassword,
  });
};

/**
 * Cria mutation de redefinição de senha via token.
 * @param authApi API de autenticação opcional para injeção em testes.
 * @returns Mutation de redefinição de senha.
 */
export const useResetPasswordMutation = (
  authApi?: AuthApi,
): ResetPasswordMutation => {
  const resolvedAuthApi = resolveAuthApi(authApi);

  return useMutation({
    mutationFn: resolvedAuthApi.resetPassword,
  });
};
