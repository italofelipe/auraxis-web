import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { AuthEmailClient } from "../auth-email.client";

const mockHttp = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as AxiosInstance;

describe("AuthEmailClient", () => {
  const client = new AuthEmailClient(mockHttp);

  it("calls POST /auth/email/confirm with the token in the JSON body", async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: { success: true } });
    await client.confirmEmail("abc123");
    expect(mockHttp.post).toHaveBeenCalledWith("/auth/email/confirm", {
      token: "abc123",
    });
  });

  it("calls POST /auth/email/resend", async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({ data: { success: true } });
    await client.resendConfirmation();
    expect(mockHttp.post).toHaveBeenCalledWith("/auth/email/resend");
  });

  it("propagates errors from confirmEmail", async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(new Error("Network error"));
    await expect(client.confirmEmail("bad-token")).rejects.toThrow("Network error");
  });

  it("propagates errors from resendConfirmation", async () => {
    vi.mocked(mockHttp.post).mockRejectedValueOnce(new Error("Server error"));
    await expect(client.resendConfirmation()).rejects.toThrow("Server error");
  });
});
