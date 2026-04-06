import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserAccountClient } from "./user-account.client";

/**
 * Builds a minimal mock AxiosInstance for testing.
 *
 * @returns Mocked Axios instance with a delete spy.
 */
const makeHttp = (): { delete: ReturnType<typeof vi.fn> } => ({
  delete: vi.fn(),
});

describe("UserAccountClient", () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it("sends DELETE /user/me with the password in the request body", async (): Promise<void> => {
    const http = makeHttp();
    http.delete.mockResolvedValue({ data: { success: true } });
    const client = new UserAccountClient(http as never);

    await client.deleteAccount("MinhaSenha@123");

    expect(http.delete).toHaveBeenCalledOnce();
    expect(http.delete).toHaveBeenCalledWith("/user/me", {
      data: { password: "MinhaSenha@123" },
    });
  });

  it("resolves without returning a value on success (void)", async (): Promise<void> => {
    const http = makeHttp();
    http.delete.mockResolvedValue({ data: { success: true } });
    const client = new UserAccountClient(http as never);

    const result = await client.deleteAccount("MinhaSenha@123");

    expect(result).toBeUndefined();
  });

  it("propagates network errors without catching them", async (): Promise<void> => {
    const http = makeHttp();
    http.delete.mockRejectedValue(new Error("Network error"));
    const client = new UserAccountClient(http as never);

    await expect(client.deleteAccount("MinhaSenha@123")).rejects.toThrow(
      "Network error",
    );
  });

  it("propagates 403 authentication errors so the mutation can handle them", async (): Promise<void> => {
    const http = makeHttp();
    const authError = Object.assign(new Error("Forbidden"), { status: 403 });
    http.delete.mockRejectedValue(authError);
    const client = new UserAccountClient(http as never);

    await expect(client.deleteAccount("wrong-password")).rejects.toThrow(
      "Forbidden",
    );
  });

  it("sends the exact password string provided without trimming", async (): Promise<void> => {
    const http = makeHttp();
    http.delete.mockResolvedValue({ data: { success: true } });
    const client = new UserAccountClient(http as never);

    await client.deleteAccount(" senha com espaços ");

    expect(http.delete).toHaveBeenCalledWith("/user/me", {
      data: { password: " senha com espaços " },
    });
  });
});
