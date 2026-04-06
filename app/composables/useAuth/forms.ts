import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import {
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  type ForgotPasswordSchema,
  type LoginSchema,
  type RegisterSchema,
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
