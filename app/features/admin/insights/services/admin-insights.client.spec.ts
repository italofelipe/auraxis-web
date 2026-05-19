import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AdminInsightsClient } from "./admin-insights.client";

/**
 * Creates the admin insights client with a mocked HTTP adapter.
 *
 * @returns Client and mocked get method.
 */
const makeClient = (): {
  readonly client: AdminInsightsClient;
  readonly get: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const http = { get } as unknown as AxiosInstance;

  return {
    client: new AdminInsightsClient(http),
    get,
  };
};

describe("AdminInsightsClient", () => {
  it("lists AI insights with filters and maps operational kpis", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              id: "insight-1",
              user_id: "user-1",
              user_email: "ana@auraxis.com",
              period_label: "Maio de 2026",
              status: "generated",
              model: "gpt-5.4",
              tokens_used: 1240,
              cost_usd: 0.42,
              latency_ms: 980,
              consent_status: "granted",
              evidence_count: 3,
              risk_level: "low",
              data_quality: "boa",
              created_at: "2026-05-19T12:00:00Z",
            },
          ],
          page: 2,
          per_page: 10,
          total: 21,
          kpis: {
            total_cost_usd: 12.5,
            total_tokens: 98_000,
            failed_count: 2,
            missing_consent_count: 1,
          },
        },
      },
    });

    const result = await client.listInsights({
      search: "ana",
      status: "generated",
      model: "gpt-5.4",
      page: 2,
      perPage: 10,
    });

    expect(get).toHaveBeenCalledWith("/admin/ai/insights", {
      params: {
        q: "ana",
        status: "generated",
        model: "gpt-5.4",
        page: 2,
        per_page: 10,
      },
    });
    expect(result.kpis.totalCostUsd).toBe(12.5);
    expect(result.items[0]).toMatchObject({
      id: "insight-1",
      userEmail: "ana@auraxis.com",
      model: "gpt-5.4",
      consentStatus: "granted",
    });
  });

  it("loads detail with redacted evidence and audit events", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        data: {
          id: "insight-1",
          user_email: "ana@auraxis.com",
          period_label: "Maio de 2026",
          status: "generated",
          summary: "Gastos concentrados em despesas fixas.",
          prompt_template_version: "ai-insights-v3",
          snapshot_hash: "sha256:abc",
          redacted_evidence: ["Categoria [redigida] aumentou 18%"],
          audit_events: [
            {
              id: "audit-1",
              action: "ai.insight.generated",
              actor_email: "system@auraxis.com",
              created_at: "2026-05-19T12:01:00Z",
            },
          ],
        },
      },
    });

    await expect(client.getInsight("insight-1")).resolves.toMatchObject({
      id: "insight-1",
      summary: "Gastos concentrados em despesas fixas.",
      promptTemplateVersion: "ai-insights-v3",
      snapshotHash: "sha256:abc",
      redactedEvidence: ["Categoria [redigida] aumentou 18%"],
      auditEvents: [
        {
          id: "audit-1",
          action: "ai.insight.generated",
        },
      ],
    });
    expect(get).toHaveBeenCalledWith("/admin/ai/insights/insight-1");
  });
});
