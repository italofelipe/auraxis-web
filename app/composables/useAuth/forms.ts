import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordSchema,
  type LoginSchema,
  type RegisterSchema,
} from "~/schemas/auth";

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
