import { describe, expect, it, vi } from "vitest";

import { AIInsightsApiClient } from "./ai-insights-api";

describe("AIInsightsApiClient", () => {
  it("generates period-aware insights through the canonical endpoint", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          message: "ok",
          data: {
            summary: "Resumo do dia",
            items: [
              {
                type: "saude_financeira",
                dimension: "general",
                title: "Saldo positivo",
                message: "Você terminou o período no azul.",
                evidence: ["current_period.paid.balance"],
              },
            ],
            period_type: "daily",
            period_label: "2026-05-18",
            period_start: "2026-05-18",
            period_end: "2026-05-18",
            tokens_used: 280,
            cost_usd: 0.000042,
            model: "gpt-4o-mini",
            cached: false,
          },
        },
        headers: { "x-ai-calls-remaining": "1" },
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    const result = await client.generateInsight({
      periodType: "daily",
      anchorDate: "2026-05-18",
    });

    expect(http.post).toHaveBeenCalledWith("/ai/insights/generate", {
      period_type: "daily",
      anchor_date: "2026-05-18",
    });
    expect(result.callsRemaining).toBe(1);
    expect(result.period_type).toBe("daily");
    expect(result.items[0]?.dimension).toBe("general");
  });

  it("does not send financial context from the browser when generating insights", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          data: {
            summary: "Resumo",
            items: [],
            period_type: "monthly",
            period_label: "2026-05",
            period_start: "2026-05-01",
            period_end: "2026-05-31",
            tokens_used: 120,
            cost_usd: 0.00002,
            model: "gpt-4o-mini",
            cached: true,
          },
        },
        headers: {},
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    await client.generateInsight({ periodType: "monthly" });

    expect(http.post).toHaveBeenCalledWith("/ai/insights/generate", {
      period_type: "monthly",
    });
    expect(http.post.mock.calls[0]?.[1]).not.toHaveProperty("transactions");
    expect(http.post.mock.calls[0]?.[1]).not.toHaveProperty("accounts");
    expect(http.post.mock.calls[0]?.[1]).not.toHaveProperty("context");
  });

  it("fetches paginated insight history from the backend envelope", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          success: true,
          message: "ok",
          data: { items: [], page: 2, per_page: 10, total: 22 },
        },
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    const result = await client.fetchInsightHistory(2, 10);

    expect(http.get).toHaveBeenCalledWith("/ai/insights/history", {
      params: { page: 2, per_page: 10 },
    });
    expect(result).toEqual({ items: [], page: 2, per_page: 10, total: 22 });
  });

  it("grants AI consent through the versioned consent endpoint", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: "consent-1",
            kind: "ai",
            version: "1.0",
            action: "granted",
            source: "web",
            created_at: "2026-05-17T12:00:00",
          },
        },
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    await client.grantAIConsent();

    expect(http.post).toHaveBeenCalledWith("/me/consents", {
      kind: "ai",
      version: "1.0",
      action: "granted",
      source: "web",
    });
  });

  it("reads the latest consent list to determine active AI consent", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            items: [
              { kind: "terms", action: "granted" },
              { kind: "ai", action: "granted" },
            ],
            total: 2,
          },
        },
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    await expect(client.hasAIConsent()).resolves.toBe(true);

    expect(http.get).toHaveBeenCalledWith("/me/consents");
  });
});
