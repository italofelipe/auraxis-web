import { z } from "zod";

/**
 * Type alias for the translation function passed to schema factories.
 * Supports both simple keys and keys with named parameters.
 */
type TFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Creates a login validation schema with i18n-aware messages.
 *
 * @param t vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema for the login form.
 */
export const createLoginSchema = (t: TFunction): z.ZodObject<{
  email: z.ZodString;
  password: z.ZodString;
}> =>
  z.object({
    email: z.string().trim().email(t("validation.email.invalid")),
    password: z.string().min(8, t("validation.password.minLength", { min: 8 })),
  });

/**
 * Creates a registration validation schema with i18n-aware messages.
 *
 * @param t vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema for the registration form.
 */
export const createRegisterSchema = (t: TFunction): z.ZodEffects<z.ZodObject<{
  name: z.ZodString;
  email: z.ZodString;
  password: z.ZodString;
  confirmPassword: z.ZodString;
}>> =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, t("validation.name.minLength", { min: 2 }))
        .max(128, t("validation.name.maxLength", { max: 128 })),
      email: z.string().trim().email(t("validation.email.invalid")),
      password: z
        .string()
        .min(10, t("validation.password.minLength", { min: 10 }))
        .regex(/[A-Z]/, t("validation.password.uppercase"))
        .regex(/\d/, t("validation.password.number"))
        .regex(/[^A-Za-z0-9]/, t("validation.password.symbol")),
      confirmPassword: z.string().min(1, t("validation.password.confirm")),
    })
    .refine((payload) => payload.password === payload.confirmPassword, {
      message: t("validation.password.mismatch"),
      path: ["confirmPassword"],
    });

/**
 * Creates a forgot-password validation schema with i18n-aware messages.
 *
 * @param t vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema for the forgot-password form.
 */
export const createForgotPasswordSchema = (t: TFunction): z.ZodObject<{
  email: z.ZodString;
}> =>
  z.object({
    email: z.string().trim().email(t("validation.email.invalid")),
  });

/**
 * Creates a reset-password validation schema with i18n-aware messages.
 *
 * @param t vue-i18n translation function (from `useI18n().t`).
 * @returns Zod schema for the reset-password form.
 */
export const createResetPasswordSchema = (t: TFunction): z.ZodEffects<z.ZodObject<{
  password: z.ZodString;
  confirmPassword: z.ZodString;
}>> =>
  z
    .object({
      password: z
        .string()
        .min(10, t("validation.password.minLength", { min: 10 }))
        .regex(/[A-Z]/, t("validation.password.uppercase"))
        .regex(/\d/, t("validation.password.number"))
        .regex(/[^A-Za-z0-9]/, t("validation.password.symbol")),
      confirmPassword: z.string().min(1, t("validation.password.confirm")),
    })
    .refine((payload) => payload.password === payload.confirmPassword, {
      message: t("validation.password.mismatch"),
      path: ["confirmPassword"],
    });

// ── Static fallback schemas (hardcoded PT-BR) ─────────────────────────────
// Retained for backward-compatibility with code that imports the plain schemas
// (e.g. `loginSchema`) without going through a setup() context.
// Prefer the factory functions above for all new and updated form components.

/** @deprecated Use `createLoginSchema(t)` inside `setup()` instead. */
export const loginSchema = createLoginSchema((key, params) => {
  if (key === "validation.password.minLength" && params?.min) {
    return `A senha precisa ter ao menos ${params.min} caracteres.`;
  }
  return key === "validation.email.invalid"
    ? "Informe um e-mail valido."
    : key;
});

/** @deprecated Use `createRegisterSchema(t)` inside `setup()` instead. */
export const registerSchema = createRegisterSchema((key, params) => {
  const msgs: Record<string, string> = {
    "validation.email.invalid": "Informe um e-mail valido.",
    "validation.password.uppercase": "A senha precisa ter ao menos uma letra maiuscula.",
    "validation.password.number": "A senha precisa ter ao menos um numero.",
    "validation.password.symbol": "A senha precisa ter ao menos um simbolo.",
    "validation.password.confirm": "Confirme sua senha.",
    "validation.password.mismatch": "As senhas precisam ser iguais.",
  };
  if (key === "validation.name.minLength" && params?.min) {
    return `O nome precisa ter ao menos ${params.min} caracteres.`;
  }
  if (key === "validation.name.maxLength" && params?.max) {
    return `O nome pode ter no maximo ${params.max} caracteres.`;
  }
  if (key === "validation.password.minLength" && params?.min) {
    return `A senha precisa ter ao menos ${params.min} caracteres.`;
  }
  return msgs[key] ?? key;
});

/** @deprecated Use `createForgotPasswordSchema(t)` inside `setup()` instead. */
export const forgotPasswordSchema = createForgotPasswordSchema((key) => {
  return key === "validation.email.invalid" ? "Informe um e-mail valido." : key;
});

/** @deprecated Use `createResetPasswordSchema(t)` inside `setup()` instead. */
export const resetPasswordSchema = createResetPasswordSchema((key, params) => {
  const msgs: Record<string, string> = {
    "validation.password.uppercase": "A senha precisa ter ao menos uma letra maiuscula.",
    "validation.password.number": "A senha precisa ter ao menos um numero.",
    "validation.password.symbol": "A senha precisa ter ao menos um simbolo.",
    "validation.password.confirm": "Confirme sua senha.",
    "validation.password.mismatch": "As senhas precisam ser iguais.",
  };
  if (key === "validation.password.minLength" && params?.min) {
    return `A senha precisa ter ao menos ${params.min} caracteres.`;
  }
  return msgs[key] ?? key;
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
