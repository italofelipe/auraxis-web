import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome precisa ter ao menos 2 caracteres.")
      .max(128, "O nome pode ter no maximo 128 caracteres."),
    email: z.string().trim().email("Informe um e-mail valido."),
    password: z
      .string()
      .min(10, "A senha precisa ter ao menos 10 caracteres.")
      .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiuscula.")
      .regex(/\d/, "A senha precisa ter ao menos um numero.")
      .regex(/[^A-Za-z0-9]/, "A senha precisa ter ao menos um simbolo."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "A senha precisa ter ao menos 10 caracteres.")
      .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiuscula.")
      .regex(/\d/, "A senha precisa ter ao menos um numero.")
      .regex(/[^A-Za-z0-9]/, "A senha precisa ter ao menos um simbolo."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
