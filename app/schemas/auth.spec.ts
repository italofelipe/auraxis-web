import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "./auth";

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
