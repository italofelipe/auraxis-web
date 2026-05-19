import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AdminUsersClient } from "./admin-users.client";

/**
 * Builds the admin users client with mocked Axios methods.
 *
 * @returns Client and spies for HTTP methods.
 */
const makeClient = (): {
  readonly client: AdminUsersClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly post: ReturnType<typeof vi.fn>;
  readonly deleteRequest: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const post = vi.fn();
  const deleteRequest = vi.fn();
  const http = { get, post, delete: deleteRequest } as unknown as AxiosInstance;

  return {
    client: new AdminUsersClient(http),
    get,
    post,
    deleteRequest,
  };
};

describe("AdminUsersClient", () => {
  it("lists users with the expected admin query params and maps the v2 envelope", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: [
            {
              id: "user-1",
              name: "Ana Premium",
              email: "ana@auraxis.com",
              status: "active",
              created_at: "2026-05-01T10:00:00Z",
              last_seen_at: "2026-05-19T12:00:00Z",
              subscription: { plan_code: "premium", status: "active" },
              entitlements_count: 3,
            },
          ],
          page: 2,
          per_page: 25,
          total: 42,
        },
      },
    });

    const result = await client.listUsers({ search: "ana", page: 2, perPage: 25 });

    expect(get).toHaveBeenCalledWith("/admin/users", {
      params: { q: "ana", page: 2, per_page: 25 },
    });
    expect(result).toEqual({
      users: [
        {
          id: "user-1",
          name: "Ana Premium",
          email: "ana@auraxis.com",
          status: "active",
          createdAt: "2026-05-01T10:00:00Z",
          lastSeenAt: "2026-05-19T12:00:00Z",
          subscriptionPlan: "premium",
          subscriptionStatus: "active",
          entitlementCount: 3,
        },
      ],
      page: 2,
      perPage: 25,
      total: 42,
    });
  });

  it("loads user detail with subscription, entitlements and audit events", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          user: {
            id: "user-1",
            name: "Ana Premium",
            email: "ana@auraxis.com",
            status: "active",
            created_at: "2026-05-01T10:00:00Z",
            subscription: {
              plan_code: "premium",
              status: "active",
              billing_cycle: "annual",
              current_period_end: "2036-05-16T17:08:02Z",
            },
            entitlements: [
              {
                id: "ent-1",
                feature_key: "ai_insights",
                label: "Insights com IA",
                active: true,
                granted_at: "2026-05-16T17:08:02Z",
                expires_at: null,
              },
            ],
            audit_events: [
              {
                id: "audit-1",
                action: "entitlement.granted",
                reason: "Suporte ao teste premium",
                created_at: "2026-05-16T17:09:00Z",
              },
            ],
          },
        },
      },
    });

    await expect(client.getUser("user-1")).resolves.toMatchObject({
      id: "user-1",
      subscription: {
        planCode: "premium",
        status: "active",
        billingCycle: "annual",
      },
      entitlements: [
        {
          id: "ent-1",
          featureKey: "ai_insights",
          label: "Insights com IA",
          active: true,
        },
      ],
      auditEvents: [
        {
          id: "audit-1",
          action: "entitlement.granted",
          reason: "Suporte ao teste premium",
        },
      ],
    });
    expect(get).toHaveBeenCalledWith("/admin/users/user-1");
  });

  it("grants an entitlement with user id, feature key and reason", async () => {
    const { client, post } = makeClient();
    post.mockResolvedValue({
      data: {
        success: true,
        data: {
          audit_id: "audit-123",
          entitlement: {
            id: "ent-123",
            feature_key: "ai_insights",
            label: "Insights com IA",
            active: true,
            granted_at: "2026-05-19T10:00:00Z",
          },
        },
      },
    });

    const result = await client.grantEntitlement({
      userId: "user-1",
      featureKey: "ai_insights",
      reason: "Liberar teste de suporte",
    });

    expect(post).toHaveBeenCalledWith("/entitlements/admin", {
      user_id: "user-1",
      feature_key: "ai_insights",
      reason: "Liberar teste de suporte",
    });
    expect(result.auditId).toBe("audit-123");
    expect(result.entitlement?.id).toBe("ent-123");
  });

  it("revokes an entitlement with a reason in the delete body", async () => {
    const { client, deleteRequest } = makeClient();
    deleteRequest.mockResolvedValue({
      data: {
        success: true,
        data: { audit_id: "audit-456" },
      },
    });

    const result = await client.revokeEntitlement({
      entitlementId: "ent-123",
      reason: "Acesso temporário encerrado",
    });

    expect(deleteRequest).toHaveBeenCalledWith("/entitlements/admin/ent-123", {
      data: { reason: "Acesso temporário encerrado" },
    });
    expect(result.auditId).toBe("audit-456");
  });
});
