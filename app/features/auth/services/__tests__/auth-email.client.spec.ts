import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { AuthEmailClient } from "../auth-email.client";

const mockHttp = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as AxiosInstance;

describe("AuthEmailClient", () => {
  const client = new AuthEmailClient(mockHttp);

  it("calls GET /auth/confirm-email with the token param", async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({ data: { success: true } });
    await client.confirmEmail("abc123");
    expect(mockHttp.get).toHaveBeenCalledWith("/auth/confirm-email", {
      params: { token: "abc123" },
    });
  });

  it("calls POST /auth/resend-confirmation", async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: { success: true } });
    await client.resendConfirmation();
    expect(mockHttp.post).toHaveBeenCalledWith("/auth/resend-confirmation");
  });

  it("propagates errors from confirmEmail", async () => {
    vi.mocked(mockHttp.get).mockRejectedValueOnce(new Error("Network error"));
    await expect(client.confirmEmail("bad-token")).rejects.toThrow("Network error");
  });

  it("propagates errors from resendConfirmation", async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(new Error("Server error"));
    await expect(client.resendConfirmation()).rejects.toThrow("Server error");
  });
});
