import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AdminOperationsClient } from "./admin-operations.client";

/**
 * Creates the admin operations client with a mocked HTTP adapter.
 *
 * @returns Client and mocked HTTP methods.
 */
const makeClient = (): {
  readonly client: AdminOperationsClient;
  readonly get: ReturnType<typeof vi.fn>;
  readonly patch: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const patch = vi.fn();
  const http = { get, patch } as unknown as AxiosInstance;

  return {
    client: new AdminOperationsClient(http),
    get,
    patch,
  };
};

describe("AdminOperationsClient", () => {
  it("lists feature flags from the admin endpoint", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          flags: [
            {
              key: "web.pages.insights",
              owner: "growth",
              type: "release",
              status: "enabled-prod",
              description: "Insights page",
              remove_by: "2027-12-31",
              repositories: ["auraxis-web"],
              updated_at: "2026-05-19T12:00:00Z",
            },
          ],
        },
      },
    });

    await expect(client.listFeatureFlags()).resolves.toEqual({
      flags: [
        {
          key: "web.pages.insights",
          owner: "growth",
          type: "release",
          status: "enabled-prod",
          description: "Insights page",
          removeBy: "2027-12-31",
          repositories: ["auraxis-web"],
          updatedAt: "2026-05-19T12:00:00Z",
        },
      ],
    });
    expect(get).toHaveBeenCalledWith("/admin/feature-flags");
  });

  it("updates one feature flag with status and audit reason", async () => {
    const { client, patch } = makeClient();
    patch.mockResolvedValue({
      data: {
        success: true,
        data: {
          audit_id: "audit-flag-1",
          flag: {
            key: "web.pages.insights",
            status: "enabled-staging",
            description: "Insights page",
          },
        },
      },
    });

    const result = await client.updateFeatureFlag({
      key: "web.pages.insights",
      status: "enabled-staging",
      reason: "Rollout progressivo em staging",
    });

    expect(patch).toHaveBeenCalledWith("/admin/feature-flags/web.pages.insights", {
      status: "enabled-staging",
      reason: "Rollout progressivo em staging",
    });
    expect(result.auditId).toBe("audit-flag-1");
    expect(result.flag.status).toBe("enabled-staging");
  });

  it("loads the operational summary with Grafana link and queues", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          api_status: "healthy",
          ai_circuit_breaker: "closed",
          monthly_ai_cost_usd: 9.4,
          monthly_ai_budget_usd: 120,
          pending_incidents: 0,
          grafana_url: "https://grafana.example.com/d/auraxis",
          last_sync_at: "2026-05-19T12:00:00Z",
          queues: [
            {
              name: "ai-insights",
              pending: 2,
              oldest_age_seconds: 30,
            },
          ],
        },
      },
    });

    await expect(client.getOperationalSummary()).resolves.toMatchObject({
      apiStatus: "healthy",
      aiCircuitBreaker: "closed",
      monthlyAiCostUsd: 9.4,
      grafanaUrl: "https://grafana.example.com/d/auraxis",
      queues: [{ name: "ai-insights", pending: 2 }],
    });
    expect(get).toHaveBeenCalledWith("/admin/operations/summary");
  });
});
