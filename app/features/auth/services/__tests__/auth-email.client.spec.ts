import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";

import { ApiError } from "~/core/errors";
import { AuthEmailClient } from "../auth-email.client";

const mockHttp = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as AxiosInstance;

const mockAnonymous = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as AxiosInstance;

describe("AuthEmailClient", () => {
  const client = new AuthEmailClient(mockHttp, mockAnonymous);

  it("calls POST /auth/email/confirm via the anonymous client", async () => {
    vi.mocked(mockAnonymous.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: "ok",
        data: {
          token: "jwt-abc.payload.sig",
          user: {
            identity: { id: "u-1", name: "Smoke", email: "u@a.com" },
            email_verification: {
              verified: true,
              deadline_at: null,
              required_now: false,
              days_remaining: null,
            },
          },
        },
      },
    });

    const result = await client.confirmEmail("abc123");

    expect(mockAnonymous.post).toHaveBeenCalledWith(
      "/auth/email/confirm",
      { token: "abc123" },
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-Contract": "v2" }),
        withCredentials: true,
      }),
    );
    expect(result.kind).toBe("signed_in");
    if (result.kind !== "signed_in") {
      throw new Error("Expected signed-in confirmation result");
    }
    expect(result.token).toBe("jwt-abc.payload.sig");
    expect(result.user.identity.email).toBe("u@a.com");
  });

  it("sets an explicit 15s timeout for the anonymous confirmation request", async () => {
    vi.mocked(mockAnonymous.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: "ok",
        data: {
          token: "jwt-abc.payload.sig",
          user: {
            identity: { id: "u-1", name: "Smoke", email: "u@a.com" },
            email_verification: {
              verified: true,
              deadline_at: null,
              required_now: false,
              days_remaining: null,
            },
          },
        },
      },
    });

    await client.confirmEmail("abc123");

    expect(mockAnonymous.post).toHaveBeenCalledWith(
      "/auth/email/confirm",
      { token: "abc123" },
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("normalizes successful confirmation without a magic-link session", async () => {
    vi.mocked(mockAnonymous.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: "E-mail confirmado. Entre para continuar.",
        data: null,
      },
    });

    await expect(client.confirmEmail("abc123")).resolves.toEqual({
      kind: "confirmed_without_session",
      message: "E-mail confirmado. Entre para continuar.",
    });
  });

  it("does NOT use the authenticated http client for confirmEmail", async () => {
    vi.mocked(mockAnonymous.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: "ok",
        data: {
          token: "t",
          user: {
            identity: { id: "u", name: "n", email: "e" },
            email_verification: {
              verified: true,
              deadline_at: null,
              required_now: false,
              days_remaining: null,
            },
          },
        },
      },
    });

    await client.confirmEmail("abc");

    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("throws ApiError when the envelope is missing token or user", async () => {
    vi.mocked(mockAnonymous.post).mockResolvedValueOnce({
      data: { success: true, message: "ok", data: {} },
    });

    await expect(client.confirmEmail("abc")).rejects.toBeInstanceOf(ApiError);
  });

  it("propagates errors from the anonymous client", async () => {
    vi.mocked(mockAnonymous.post).mockRejectedValueOnce(
      new Error("Network error"),
    );
    await expect(client.confirmEmail("bad-token")).rejects.toThrow(
      "Network error",
    );
  });

  it("normalizes anonymous confirmation failures into ApiError without leaking the raw token", async () => {
    vi.mocked(mockAnonymous.post).mockRejectedValueOnce({
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        status: 400,
        data: {
          message: "Link inválido ou expirado.",
          code: "INVALID_EMAIL_CONFIRMATION_TOKEN",
        },
      },
    });

    const confirmation = client.confirmEmail("raw-secret-token");

    await expect(confirmation).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Link inválido ou expirado.",
      code: "INVALID_EMAIL_CONFIRMATION_TOKEN",
    });
    await expect(confirmation).rejects.not.toThrow("raw-secret-token");
  });

  it("calls POST /auth/email/resend via the authenticated http client", async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      data: { success: true },
    });
    await client.resendConfirmation();
    expect(mockHttp.post).toHaveBeenCalledWith("/auth/email/resend");
  });

  it("propagates errors from resendConfirmation", async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(new Error("Server error"));
    await expect(client.resendConfirmation()).rejects.toThrow("Server error");
  });
});
