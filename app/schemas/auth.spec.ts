import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, loginSchema } from "./auth";

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
