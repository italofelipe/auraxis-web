import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AdminMetricsClient } from "./admin-metrics.client";

const overviewDto = {
  generated_at: "2026-07-24T18:00:00Z",
  cache: { hit: false, ttl_seconds: 300 },
  users: {
    total: 42,
    verified: 30,
    blocked: 1,
    new_7d: 3,
    new_30d: 9,
    active_7d: 12,
    active_30d: 25,
    active_source: "refresh_tokens_proxy",
  },
  premium: {
    subscriptions_active: 4,
    trials_active: 11,
    overrides_active: 3,
    entitled_users: 18,
    new_subscriptions_30d: 2,
    conversion_pct: 13.3,
  },
  ai: {
    calls_7d: 120,
    tokens_7d: 45000,
    cost_usd_7d: 1.23,
    cost_usd_mtd: 3.87,
    avg_latency_ms_7d: 900,
    active_users_7d: 8,
  },
  activity: {
    transactions_7d: 87,
    goal_contributions_7d: 5,
    goals_created_7d: 2,
    budgets_active: 6,
    simulations_7d: 4,
    insight_runs_7d: 9,
  },
};

/**
 * Creates the admin metrics client with a mocked HTTP adapter.
 *
 * @returns Client and mocked get method.
 */
const makeClient = (): {
  readonly client: AdminMetricsClient;
  readonly get: ReturnType<typeof vi.fn>;
} => {
  const get = vi.fn();
  const http = { get } as unknown as AxiosInstance;

  return { client: new AdminMetricsClient(http), get };
};

describe("AdminMetricsClient", () => {
  it("fetches the overview and maps every block to the domain contract", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({ data: overviewDto });

    const overview = await client.getOverview();

    expect(get).toHaveBeenCalledWith("/v2/admin/metrics/overview");
    expect(overview.generatedAt).toBe("2026-07-24T18:00:00Z");
    expect(overview.cache).toEqual({ hit: false, ttlSeconds: 300 });
    expect(overview.users).toEqual({
      total: 42,
      verified: 30,
      blocked: 1,
      new7d: 3,
      new30d: 9,
      active7d: 12,
      active30d: 25,
      activeSource: "refresh_tokens_proxy",
    });
    expect(overview.premium).toEqual({
      subscriptionsActive: 4,
      trialsActive: 11,
      overridesActive: 3,
      entitledUsers: 18,
      newSubscriptions30d: 2,
      conversionPct: 13.3,
    });
    expect(overview.ai).toEqual({
      calls7d: 120,
      tokens7d: 45000,
      costUsd7d: 1.23,
      costUsdMtd: 3.87,
      avgLatencyMs7d: 900,
      activeUsers7d: 8,
    });
    expect(overview.activity).toEqual({
      transactions7d: 87,
      goalContributions7d: 5,
      goalsCreated7d: 2,
      budgetsActive: 6,
      simulations7d: 4,
      insightRuns7d: 9,
    });
  });

  it("unwraps a v2 envelope around the overview payload", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({ data: { data: overviewDto } });

    const overview = await client.getOverview();

    expect(overview.users.total).toBe(42);
  });

  it("fetches one block timeseries with the requested window", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        block: "users",
        interval: "day",
        points: [
          { date: "2026-07-01", signups: 2, active_users: 4 },
          { date: "2026-07-02", signups: 0, active_users: 5 },
        ],
      },
    });

    const series = await client.getTimeseries("users", {
      from: "2026-06-25",
      to: "2026-07-24",
      interval: "day",
    });

    expect(get).toHaveBeenCalledWith("/v2/admin/metrics/users/timeseries", {
      params: { from: "2026-06-25", to: "2026-07-24", interval: "day" },
    });
    expect(series.block).toBe("users");
    expect(series.interval).toBe("day");
    expect(series.points).toEqual([
      { date: "2026-07-01", values: { signups: 2, active_users: 4 } },
      { date: "2026-07-02", values: { signups: 0, active_users: 5 } },
    ]);
  });

  it("ignores non-numeric extras in timeseries points", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        block: "ai",
        interval: "day",
        points: [{ date: "2026-07-01", cost_usd: 0.4, note: "backfill" }],
      },
    });

    const series = await client.getTimeseries("ai", {
      from: "2026-07-01",
      to: "2026-07-01",
      interval: "day",
    });

    expect(series.points[0]?.values).toEqual({ cost_usd: 0.4 });
  });

  it("fetches the AI breakdown and maps rows to the domain contract", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        by: "model",
        rows: [
          { key: "gpt-4o", calls: 10, tokens: 1234, cost_usd: 0.42, avg_latency_ms: 800 },
        ],
      },
    });

    const breakdown = await client.getAiBreakdown({ by: "model", limit: 5 });

    expect(get).toHaveBeenCalledWith("/v2/admin/metrics/ai/breakdown", {
      params: { by: "model", limit: 5 },
    });
    expect(breakdown.by).toBe("model");
    expect(breakdown.rows).toEqual([
      { key: "gpt-4o", userEmail: null, calls: 10, tokens: 1234, costUsd: 0.42, avgLatencyMs: 800 },
    ]);
  });

  it("keeps user_email when breaking down by user", async () => {
    const { client, get } = makeClient();
    get.mockResolvedValue({
      data: {
        by: "user",
        rows: [
          {
            key: "user-1",
            user_email: "ana@auraxis.com",
            calls: 4,
            tokens: 900,
            cost_usd: 0.08,
            avg_latency_ms: 750,
          },
        ],
      },
    });

    const breakdown = await client.getAiBreakdown({ by: "user" });

    expect(get).toHaveBeenCalledWith("/v2/admin/metrics/ai/breakdown", {
      params: { by: "user", limit: 20 },
    });
    expect(breakdown.rows[0]?.userEmail).toBe("ana@auraxis.com");
  });

  it("propagates HTTP errors without masking them", async () => {
    const { client, get } = makeClient();
    get.mockRejectedValue(new Error("Request failed with status code 500"));

    await expect(client.getOverview()).rejects.toThrow("500");
  });
});
