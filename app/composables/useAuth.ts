import { useMutation } from "@tanstack/vue-query";
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
import { forgotPasswordSchema, loginSchema, registerSchema } from "~/schemas/auth";
import { useSessionStore } from "~/stores/session";
import { useHttp } from "~/composables/useHttp";

interface HttpAdapter {
  post<TResponse>(
    url: string,
    payload?: unknown,
  ): Promise<{ data: TResponse }>;
}

export const createAuthApi = (http: HttpAdapter) => {
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

export const useLoginForm = () => {
  return useForm({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: {
      email: "",
      password: "",
    },
  });
};

export const useRegisterForm = () => {
  return useForm({
    validationSchema: toTypedSchema(registerSchema),
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

export const useForgotPasswordForm = () => {
  return useForm({
    validationSchema: toTypedSchema(forgotPasswordSchema),
    initialValues: {
      email: "",
    },
  });
};

export const useLoginMutation = () => {
  const authApi = createAuthApi(useHttp());
  const sessionStore = useSessionStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      sessionStore.signIn(response.accessToken, response.user.email);
    },
  });
};

export const useRegisterMutation = () => {
  const authApi = createAuthApi(useHttp());
  const sessionStore = useSessionStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      sessionStore.signIn(response.accessToken, response.user.email);
    },
  });
};

export const useForgotPasswordMutation = () => {
  const authApi = createAuthApi(useHttp());

  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
};
