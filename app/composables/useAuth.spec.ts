import { describe, expect, it, vi } from "vitest";

import { createAuthApi } from "./useAuth";

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
        accepted: true,
        message: "Email sent",
      },
    });

    const authApi = createAuthApi({ post });
    const response = await authApi.forgotPassword({
      email: "user@auraxis.com",
    });

    expect(post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@auraxis.com",
    });
    expect(response.accepted).toBe(true);
  });
});
