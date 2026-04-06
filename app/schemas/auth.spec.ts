import { describe, expect, it } from "vitest";

import {
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth";

describe("auth schemas", () => {
  it("valida login com email e senha", () => {
    const parsed = loginSchema.parse({
      email: "user@auraxis.com",
      password: "12345678",
    });

    expect(parsed.email).toBe("user@auraxis.com");
  });

  it("rejeita senha curta", () => {
    const parsed = loginSchema.safeParse({
      email: "user@auraxis.com",
      password: "123",
    });

    expect(parsed.success).toBe(false);
  });

  it("valida forgot password", () => {
    const parsed = forgotPasswordSchema.parse({
      email: "user@auraxis.com",
    });

    expect(parsed.email).toBe("user@auraxis.com");
  });
});

describe("registerSchema", () => {
  it("valida registro com todos os campos válidos", () => {
    const result = registerSchema.parse({
      name: "João Silva",
      email: "joao@auraxis.com",
      password: "Senha@12345",
      confirmPassword: "Senha@12345",
    });

    expect(result.email).toBe("joao@auraxis.com");
    expect(result.name).toBe("João Silva");
  });

  it("rejeita nome muito curto (menos de 2 caracteres)", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "joao@auraxis.com",
      password: "Senha@12345",
      confirmPassword: "Senha@12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita quando senhas não coincidem", () => {
    const result = registerSchema.safeParse({
      name: "João Silva",
      email: "joao@auraxis.com",
      password: "Senha@12345",
      confirmPassword: "OutraSenha@1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path[0]);
      expect(paths).toContain("confirmPassword");
    }
  });
});

describe("createLoginSchema factory", () => {
  /**
   * Identity translation stub — returns the raw i18n key unchanged.
   *
   * @param key - The i18n key to translate.
   * @returns The key itself.
   */
  const t = (key: string): string => key;

  it("valida login válido usando a factory i18n", () => {
    const schema = createLoginSchema(t);
    const result = schema.parse({ email: "user@test.com", password: "12345678" });

    expect(result.email).toBe("user@test.com");
  });

  it("rejeita email inválido", () => {
    const schema = createLoginSchema(t);
    const result = schema.safeParse({ email: "not-an-email", password: "12345678" });

    expect(result.success).toBe(false);
  });
});

describe("createRegisterSchema factory", () => {
  /**
   * Identity translation stub — returns the raw i18n key unchanged.
   *
   * @param key - The i18n key to translate.
   * @returns The key itself.
   */
  const t = (key: string): string => key;

  it("valida registro válido usando a factory i18n", () => {
    const schema = createRegisterSchema(t);
    const result = schema.parse({
      name: "Maria Souza",
      email: "maria@test.com",
      password: "Senha@12345",
      confirmPassword: "Senha@12345",
    });

    expect(result.email).toBe("maria@test.com");
  });
});

describe("createForgotPasswordSchema factory", () => {
  /**
   * Identity translation stub — returns the raw i18n key unchanged.
   *
   * @param key - The i18n key to translate.
   * @returns The key itself.
   */
  const t = (key: string): string => key;

  it("valida email válido para recuperação de senha", () => {
    const schema = createForgotPasswordSchema(t);
    const result = schema.parse({ email: "test@example.com" });

    expect(result.email).toBe("test@example.com");
  });
});

describe("createResetPasswordSchema factory", () => {
  /**
   * Identity translation stub — returns the raw i18n key unchanged.
   *
   * @param key - The i18n key to translate.
   * @returns The key itself.
   */
  const t = (key: string): string => key;

  it("valida redefinição de senha com campos válidos", () => {
    const schema = createResetPasswordSchema(t);
    const result = schema.parse({
      password: "Senha@12345",
      confirmPassword: "Senha@12345",
    });

    expect(result.password).toBe("Senha@12345");
  });
});

describe("resetPasswordSchema", () => {
  it("valida senha e confirmacao iguais com requisitos atendidos", () => {
    const parsed = resetPasswordSchema.parse({
      password: "Senha@12345",
      confirmPassword: "Senha@12345",
    });

    expect(parsed.password).toBe("Senha@12345");
    expect(parsed.confirmPassword).toBe("Senha@12345");
  });

  it("rejeita senhas que nao coincidem", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Senha@12345",
      confirmPassword: "OutraSenha@1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path[0]);
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejeita senha curta (menos de 10 caracteres)", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Abc@1",
      confirmPassword: "Abc@1",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha sem letra maiuscula", () => {
    const result = resetPasswordSchema.safeParse({
      password: "senha@12345",
      confirmPassword: "senha@12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha sem numero", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Senha@abcde",
      confirmPassword: "Senha@abcde",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha sem simbolo", () => {
    const result = resetPasswordSchema.safeParse({
      password: "SenhaAbc1234",
      confirmPassword: "SenhaAbc1234",
    });

    expect(result.success).toBe(false);
  });
});
