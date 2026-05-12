import { describe, expect, it, vi } from "vitest";

import { AIInsightsApiClient } from "./ai-insights-api";

describe("AIInsightsApiClient", () => {
  it("requests spending insights with month params and exposes callsRemaining from header", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          success: true,
          message: "ok",
          data: {
            insights: "[]",
            tokens_used: 280,
            cost_usd: 0.000042,
            month: "2026-05",
            model: "gpt-4o-mini",
            cached: false,
          },
        },
        headers: { "x-ai-calls-remaining": "1" },
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    const result = await client.generateSpendingInsight("2026-05");

    expect(http.get).toHaveBeenCalledWith("/ai/insights/spending", {
      params: { month: "2026-05" },
    });
    expect(result.callsRemaining).toBe(1);
    expect(result.insights).toBe("[]");
  });

  it("omits params when no month is provided", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          data: {
            insights: "[]",
            tokens_used: 120,
            cost_usd: 0.00002,
            month: "2026-05",
            model: "gpt-4o-mini",
            cached: true,
          },
        },
        headers: {},
      }),
    };
    const client = new AIInsightsApiClient(http as never);

    await client.generateSpendingInsight();

    expect(http.get).toHaveBeenCalledWith("/ai/insights/spending", {
      params: undefined,
    });
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
});
