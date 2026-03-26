import { describe, expect, it, vi } from "vitest";

import { createAuthApi } from "./api";

describe("createAuthApi", () => {
  it("faz login via endpoint auth/login", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        accessToken: "token",
        user: {
          email: "user@auraxis.com",
          displayName: "Auraxis User",
        },
      },
    });

    const authApi = createAuthApi({ post });
    const response = await authApi.login({
      email: "user@auraxis.com",
      password: "12345678",
    });

    expect(post).toHaveBeenCalledWith("/auth/login", {
      email: "user@auraxis.com",
      password: "12345678",
    });
    expect(response.user.email).toBe("user@auraxis.com");
  });

  it("executa forgot password com endpoint dedicado", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        message: "Email sent",
      },
    });

    const authApi = createAuthApi({ post });
    const response = await authApi.forgotPassword({
      email: "user@auraxis.com",
    });

    expect(post).toHaveBeenCalledWith("/auth/password/forgot", {
      email: "user@auraxis.com",
    });
    expect(response.accepted).toBe(true);
    expect(response.message).toBe("Email sent");
  });

  it("executa register no endpoint dedicado", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        accessToken: "token-register",
        user: {
          email: "new@auraxis.com",
          displayName: "New User",
        },
      },
    });

    const authApi = createAuthApi({ post });
    const response = await authApi.register({
      name: "New User",
      email: "new@auraxis.com",
      password: "Senha@12345",
    });

    expect(post).toHaveBeenCalledWith("/auth/register", {
      name: "New User",
      email: "new@auraxis.com",
      password: "Senha@12345",
    });
    expect(response.user.email).toBe("new@auraxis.com");
  });
});
