import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import {
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  type ForgotPasswordSchema,
  type LoginSchema,
  type RegisterSchema,
  type ResetPasswordSchema,
} from "~/schemas/auth";

/**
 * Inicializa formulário tipado de login com mensagens de validação i18n.
 * @returns Instância de formulário de login.
 */
export const useLoginForm = (): ReturnType<typeof useForm<LoginSchema>> => {
  const { t } = useI18n();
  return useForm<LoginSchema>({
    validationSchema: toTypedSchema(createLoginSchema(t)),
    initialValues: {
      email: "",
      password: "",
    },
  });
};

/**
 * Inicializa formulário tipado de registro com mensagens de validação i18n.
 * @returns Instância de formulário de registro.
 */
export const useRegisterForm = (): ReturnType<typeof useForm<RegisterSchema>> => {
  const { t } = useI18n();
  return useForm<RegisterSchema>({
    validationSchema: toTypedSchema(createRegisterSchema(t)),
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

/**
 * Inicializa formulário tipado de recuperação de senha com mensagens de validação i18n.
 * @returns Instância de formulário de recuperação.
 */
export const useForgotPasswordForm = (): ReturnType<
  typeof useForm<ForgotPasswordSchema>
> => {
  const { t } = useI18n();
  return useForm<ForgotPasswordSchema>({
    validationSchema: toTypedSchema(createForgotPasswordSchema(t)),
    initialValues: {
      email: "",
    },
  });
};

/**
 * Inicializa formulário tipado de redefinição de senha com mensagens i18n.
 *
 * A fábrica i18n substitui o export estático `resetPasswordSchema`, cujas
 * mensagens de fallback estão sem acento ("maiuscula", "numero", "simbolo").
 *
 * @returns Instância de formulário de redefinição.
 */
export const useResetPasswordForm = (): ReturnType<
  typeof useForm<ResetPasswordSchema>
> => {
  const { t } = useI18n();
  return useForm<ResetPasswordSchema>({
    validationSchema: toTypedSchema(createResetPasswordSchema(t)),
    initialValues: {
      password: "",
      confirmPassword: "",
    },
  });
};
