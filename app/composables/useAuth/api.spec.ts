import { describe, expect, it, vi } from "vitest";

import { createAuthApi } from "./api";

/**
 * Builds a minimal v2 auth envelope mock for login and register responses.
 *
 * @param email User email.
 * @param name User display name.
 * @param token Access token.
 * @param refreshToken Refresh token.
 * @returns Mock resolved Axios-like response with v2 envelope.
 */
function makeV2AuthResponse(
  email: string,
  name: string,
  token = "mock-token",
  refreshToken = "mock-refresh",
): { data: unknown } {
  return {
    data: {
      success: true,
      message: "OK",
      data: { token, refresh_token: refreshToken, user: { id: "uuid-1", name, email } },
    },
  };
}

describe("createAuthApi", () => {
  it("login calls POST /auth/login and normalizes v2 envelope to LoginResponse", async () => {
    const post = vi.fn().mockResolvedValue(makeV2AuthResponse("user@auraxis.com", "Auraxis User"));
    const authApi = createAuthApi({ post });

    const response = await authApi.login({
      email: "user@auraxis.com",
      password: "12345678",
    });

    expect(post).toHaveBeenCalledWith("/auth/login", {
      email: "user@auraxis.com",
      password: "12345678",
    });
    expect(response.accessToken).toBe("mock-token");
    expect(response.refreshToken).toBe("mock-refresh");
    expect(response.user.email).toBe("user@auraxis.com");
    expect(response.user.displayName).toBe("Auraxis User");
  });

  it("register calls POST /auth/register and normalizes v2 envelope to RegisterResponse", async () => {
    const post = vi.fn().mockResolvedValue(makeV2AuthResponse("new@auraxis.com", "New User", "register-token"));
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
    expect(response.accessToken).toBe("register-token");
    expect(response.refreshToken).toBe("mock-refresh");
    expect(response.user.email).toBe("new@auraxis.com");
    expect(response.user.displayName).toBe("New User");
  });

  it("forgotPassword calls POST /auth/password/forgot and normalizes legacy response", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { message: "Email sent" },
    });
    const authApi = createAuthApi({ post });

    const response = await authApi.forgotPassword({ email: "user@auraxis.com" });

    expect(post).toHaveBeenCalledWith("/auth/password/forgot", { email: "user@auraxis.com" });
    expect(response.accepted).toBe(true);
    expect(response.message).toBe("Email sent");
  });

  it("forgotPassword normalizes a response that already has the accepted field", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { accepted: false, message: "Email not found" },
    });
    const authApi = createAuthApi({ post });

    const response = await authApi.forgotPassword({ email: "unknown@auraxis.com" });

    expect(response.accepted).toBe(false);
    expect(response.message).toBe("Email not found");
  });

  it("resetPassword calls POST /auth/password/reset and returns the response data", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { message: "Password reset successfully" },
    });
    const authApi = createAuthApi({ post });

    const response = await authApi.resetPassword({
      token: "reset-token-123",
      password: "NewPassword@1",
    });

    expect(post).toHaveBeenCalledWith("/auth/password/reset", {
      token: "reset-token-123",
      password: "NewPassword@1",
    });
    expect(response.message).toBe("Password reset successfully");
  });
});
