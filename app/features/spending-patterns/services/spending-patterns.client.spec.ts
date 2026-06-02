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
});
