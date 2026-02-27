import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "~/types/contracts";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordSchema,
  type LoginSchema,
  type RegisterSchema,
} from "~/schemas/auth";
import { useSessionStore } from "~/stores/session";
import { useHttp } from "~/composables/useHttp";

interface HttpAdapter {
  post<TResponse>(url: string, payload?: unknown): Promise<{ data: TResponse }>;
}

interface AuthApi {
  login(payload: LoginRequest): Promise<LoginResponse>;
  register(payload: RegisterRequest): Promise<RegisterResponse>;
  forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
}

type LoginMutation = UseMutationReturnType<
  LoginResponse,
  unknown,
  LoginRequest,
  unknown
>;
type RegisterMutation = UseMutationReturnType<
  RegisterResponse,
  unknown,
  RegisterRequest,
  unknown
>;
type ForgotPasswordMutation = UseMutationReturnType<
  ForgotPasswordResponse,
  unknown,
  ForgotPasswordRequest,
  unknown
>;

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

/**
 * Inicializa formulário tipado de login.
 * @returns Instância de formulário de login.
 */
export const useLoginForm = (): ReturnType<typeof useForm<LoginSchema>> => {
  return useForm<LoginSchema>({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: {
      email: "",
      password: "",
    },
  });
};

/**
 * Inicializa formulário tipado de registro.
 * @returns Instância de formulário de registro.
 */
export const useRegisterForm = (): ReturnType<typeof useForm<RegisterSchema>> => {
  return useForm<RegisterSchema>({
    validationSchema: toTypedSchema(registerSchema),
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

/**
 * Inicializa formulário tipado de recuperação de senha.
 * @returns Instância de formulário de recuperação.
 */
export const useForgotPasswordForm = (): ReturnType<
  typeof useForm<ForgotPasswordSchema>
> => {
  return useForm<ForgotPasswordSchema>({
    validationSchema: toTypedSchema(forgotPasswordSchema),
    initialValues: {
      email: "",
    },
  });
};

/**
 * Cria mutation de login com sincronização da sessão local.
 * @returns Mutation de login.
 */
export const useLoginMutation = (): LoginMutation => {
  const authApi = createAuthApi(useHttp());
  const sessionStore = useSessionStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response: LoginResponse): void => {
      sessionStore.signIn(response.accessToken, response.user.email);
    },
  });
};

/**
 * Cria mutation de registro com sincronização da sessão local.
 * @returns Mutation de registro.
 */
export const useRegisterMutation = (): RegisterMutation => {
  const authApi = createAuthApi(useHttp());
  const sessionStore = useSessionStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response: RegisterResponse): void => {
      sessionStore.signIn(response.accessToken, response.user.email);
    },
  });
};

/**
 * Cria mutation de solicitação de recuperação de senha.
 * @returns Mutation de recuperação de senha.
 */
export const useForgotPasswordMutation = (): ForgotPasswordMutation => {
  const authApi = createAuthApi(useHttp());

  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
};
