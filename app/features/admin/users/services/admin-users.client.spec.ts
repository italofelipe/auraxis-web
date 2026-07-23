import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminUsersClient } from "./admin-users.client";

/**
 * Builds the service with an Axios-shaped test double.
 *
 * @returns Client and HTTP spies.
 */
const makeClient = (): {
  readonly client: AdminUsersClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly post: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const post = vi.fn();
  return {
    client: new AdminUsersClient({ get, post } as unknown as AxiosInstance),
    get,
    post,
  };
};

interface TestIdentityDto {
  readonly source: "v1" | "v2";
  readonly user_id: string;
  readonly email: string;
  readonly email_verified: boolean;
  readonly auth_methods: string[];
  readonly created_at: string;
  readonly last_login_at: string;
  readonly blocked_at: null;
  readonly blocked_reason: null;
  readonly blocked_by: null;
  readonly subscription_status: string | null;
  readonly premium_override_active: boolean;
  readonly premium_override_expires_at: null;
}

/**
 * Builds one FastAPI identity fixture.
 *
 * @param source Identity database source.
 * @param userId Source-local user id.
 * @returns FastAPI-shaped identity fixture.
 */
const identity = (source: "v1" | "v2", userId: string): TestIdentityDto => ({
  source,
  user_id: userId,
  email: "ana@auraxis.com",
  email_verified: true,
  auth_methods: ["password"],
  created_at: "2026-05-01T10:00:00Z",
  last_login_at: "2026-07-19T12:00:00Z",
  blocked_at: null,
  blocked_reason: null,
  blocked_by: null,
  subscription_status: source === "v1" ? "active" : null,
  premium_override_active: source === "v2",
  premium_override_expires_at: null,
});

describe("AdminUsersClient", () => {
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("validates the operator session through FastAPI instead of JWT roles", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: { source: "v1", user_id: "operator-1", email: "admin@auraxis.com", is_admin: true },
    });

    await expect(client.getSession()).resolves.toEqual({
      source: "v1",
      userId: "operator-1",
      email: "admin@auraxis.com",
      isAdmin: true,
    });
    expect(get).toHaveBeenCalledWith("/v2/admin/session");
  });

  it("maps the federated cursor list", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        items: [
          {
            source: "v1",
            user_id: "user-v1",
            email: "ana@auraxis.com",
            identities: [identity("v1", "user-v1"), identity("v2", "user-v2")],
            blocked: false,
            premium: true,
          },
        ],
        next_cursor: "next-page",
      },
    });

    const result = await client.listUsers({ search: "ana", cursor: "current", limit: 25 });

    expect(get).toHaveBeenCalledWith("/v2/admin/users", {
      params: {
        q: "ana",
        cursor: "current",
        limit: 25,
        status: undefined,
        source: undefined,
        premium: undefined,
      },
    });
    expect(result).toEqual({
      users: [
        {
          id: "v1/user-v1",
          source: "v1",
          userId: "user-v1",
          email: "ana@auraxis.com",
          status: "active",
          createdAt: "2026-05-01T10:00:00Z",
          lastSeenAt: "2026-07-19T12:00:00Z",
          premium: true,
          premiumOverrideActive: true,
          sources: ["v1", "v2"],
        },
      ],
      nextCursor: "next-page",
    });
  });

  it("loads operational identities and audit events", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        source: "v1",
        user_id: "user-v1",
        email: "ana@auraxis.com",
        identities: [identity("v1", "user-v1")],
        blocked: false,
        premium: true,
        recent_actions: [
          {
            id: "action-1",
            action_type: "premium_override",
            status: "applied",
            actor: "v1/operator",
            reason: "Campanha de recuperação",
            created_at: "2026-07-20T10:00:00Z",
          },
        ],
      },
    });

    await expect(client.getUser("v1/user-v1")).resolves.toMatchObject({
      id: "v1/user-v1",
      identities: [{ source: "v1", emailVerified: true }],
      auditEvents: [{ id: "action-1", status: "applied" }],
    });
    expect(get).toHaveBeenCalledWith("/v2/admin/users/v1/user-v1");
  });

  it.each([
    ["blockUser", "block"],
    ["unblockUser", "unblock"],
    ["grantPremiumOverride", "premium-override"],
    ["revokePremiumOverride", "premium-override/revoke"],
  ] as const)("sends %s with a unique idempotency key", async (method, path) => {
    const { client, post } = makeClient();
    post.mockResolvedValue({ data: { id: "action-1", status: "applied" } });

    await client[method]({
      userRef: "v2/user-v2",
      reason: "Solicitação validada pelo suporte",
      expiresAt: "2026-08-20T10:00:00Z",
    });

    expect(post).toHaveBeenCalledWith(
      `/v2/admin/users/v2/user-v2/${path}`,
      path === "premium-override"
        ? {
            reason: "Solicitação validada pelo suporte",
            expires_at: "2026-08-20T10:00:00Z",
          }
        : { reason: "Solicitação validada pelo suporte" },
      { headers: { "Idempotency-Key": "admin-web-11111111-1111-4111-8111-111111111111" } },
    );
  });
});
