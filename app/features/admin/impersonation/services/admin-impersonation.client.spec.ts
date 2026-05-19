import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AdminImpersonationClient } from "./admin-impersonation.client";

/**
 * Creates the admin impersonation client with a mocked HTTP adapter.
 *
 * @returns Client and mocked HTTP methods.
 */
const makeClient = (): {
  readonly client: AdminImpersonationClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly post: ReturnType<typeof vi.fn>;
  readonly deleteRequest: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const post = vi.fn();
  const deleteRequest = vi.fn();
  const http = { get, post, delete: deleteRequest } as unknown as AxiosInstance;

  return {
    client: new AdminImpersonationClient(http),
    get,
    post,
    deleteRequest,
  };
};

describe("AdminImpersonationClient", () => {
  it("searches users through the admin users endpoint", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          users: [
            {
              id: "user-1",
              name: "Ana Premium",
              email: "ana@auraxis.com",
              subscription: { plan_code: "premium" },
            },
          ],
        },
      },
    });

    await expect(client.searchUsers("ana")).resolves.toEqual({
      users: [
        {
          id: "user-1",
          name: "Ana Premium",
          email: "ana@auraxis.com",
          planCode: "premium",
        },
      ],
    });
    expect(get).toHaveBeenCalledWith("/admin/users", {
      params: { q: "ana", page: 1, per_page: 10 },
    });
  });

  it("starts a read-only impersonation session with an audit reason", async () => {
    const { client, post } = makeClient();
    post.mockResolvedValue({
      data: {
        data: {
          session_id: "imp-1",
          audit_id: "audit-imp-1",
          user_id: "user-1",
          user_name: "Ana Premium",
          user_email: "ana@auraxis.com",
          started_at: "2026-05-19T12:00:00Z",
          expires_at: "2026-05-19T12:15:00Z",
          read_only: true,
        },
      },
    });

    const result = await client.startSession({
      userId: "user-1",
      reason: "Reproduzir bug reportado pelo suporte",
    });

    expect(post).toHaveBeenCalledWith("/admin/impersonation/sessions", {
      user_id: "user-1",
      reason: "Reproduzir bug reportado pelo suporte",
      mode: "read_only",
    });
    expect(result).toMatchObject({
      sessionId: "imp-1",
      auditId: "audit-imp-1",
      readOnly: true,
    });
  });

  it("ends an impersonation session by id", async () => {
    const { client, deleteRequest } = makeClient();
    deleteRequest.mockResolvedValue({ data: { success: true } });

    await client.endSession("imp-1");

    expect(deleteRequest).toHaveBeenCalledWith("/admin/impersonation/sessions/imp-1");
  });
});
