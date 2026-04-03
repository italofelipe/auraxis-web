import { useMutation } from "@tanstack/vue-query";

import type {
  LoginResponse,
  RegisterResponse,
} from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";
import { useSessionStore } from "~/stores/session";

import { createAuthApi } from "./api";
import type {
  AuthApi,
  ForgotPasswordMutation,
  LoginMutation,
  RegisterMutation,
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
