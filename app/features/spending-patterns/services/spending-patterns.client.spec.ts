import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { SpendingPatternsApiClient } from "./spending-patterns.client";

const RESPONSE = {
  model: "stub",
  generated_count: 1,
  patterns: [
    { description: "Cafés diários", frequency: "diária", average_value: 12.5, suggested_action: "Defina um teto", severity: "high" },
  ],
};

describe("SpendingPatternsApiClient", () => {
  it("posts transactions and maps the enveloped response", async () => {
    const post = vi.fn().mockResolvedValue({ data: { success: true, data: RESPONSE }, headers: {} });
    const http = { post } as unknown as AxiosInstance;
    const client = new SpendingPatternsApiClient(http);

    const patterns = await client.detect(
      [{ amount: 12.5, occurred_on: "2026-05-01", kind: "expense" }],
      90,
    );

    expect(post).toHaveBeenCalledWith("/ai/insights/spending-patterns", {
      transactions: [{ amount: 12.5, occurred_on: "2026-05-01", kind: "expense" }],
      period_days: 90,
    });
    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.severity).toBe("high");
  });

  it("tolerates a flat (legacy) payload", async () => {
    const post = vi.fn().mockResolvedValue({ data: RESPONSE, headers: {} });
    const http = { post } as unknown as AxiosInstance;
    const client = new SpendingPatternsApiClient(http);

    const patterns = await client.detect([{ amount: 1, occurred_on: "2026-05-01", kind: "expense" }]);
    expect(patterns[0]?.description).toBe("Cafés diários");
  });

  it("getLatest GETs the read-only endpoint and maps the enveloped payload", async () => {
    const LATEST = {
      patterns: [
        { description: "Delivery", frequency: "semanal", average_value: 40, suggested_action: "Cozinhe mais", severity: "medium" },
      ],
      generated_at: "2026-06-05T06:00:00",
      period_label: "2026-06-05",
      model: "v2-spending-patterns",
      cost_usd: 0.000042,
      tokens_used: 280,
    };
    const get = vi.fn().mockResolvedValue({ data: { success: true, data: LATEST }, headers: {} });
    const http = { get } as unknown as AxiosInstance;
    const client = new SpendingPatternsApiClient(http);

    const result = await client.getLatest();

    expect(get).toHaveBeenCalledWith("/ai/insights/spending-patterns/latest");
    expect(result.generatedAt).toBe("2026-06-05T06:00:00");
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0]?.averageValue).toBe(40);
  });

  it("getLatest returns an empty radar when the cron has not run yet", async () => {
    const EMPTY = { patterns: [], generated_at: null, period_label: null, model: "", cost_usd: 0, tokens_used: 0 };
    const get = vi.fn().mockResolvedValue({ data: { success: true, data: EMPTY }, headers: {} });
    const http = { get } as unknown as AxiosInstance;
    const client = new SpendingPatternsApiClient(http);

    const result = await client.getLatest();
    expect(result.patterns).toEqual([]);
    expect(result.generatedAt).toBeNull();
  });
});
