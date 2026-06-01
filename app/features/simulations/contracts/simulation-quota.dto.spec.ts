import { describe, expect, it } from "vitest";

import { toSimulationQuota } from "./simulation-quota.dto";

describe("toSimulationQuota", () => {
  it("normaliza o envelope v2 (data)", () => {
    const quota = toSimulationQuota({
      success: true,
      data: {
        limit: 1,
        used: 1,
        remaining: 0,
        unlimited: false,
        allowed: false,
        reset_at: "2026-06-01T00:00:00Z",
      },
    });

    expect(quota).toEqual({
      limit: 1,
      used: 1,
      remaining: 0,
      unlimited: false,
      allowed: false,
      resetAt: "2026-06-01T00:00:00Z",
    });
  });

  it("mantém compatibilidade com payload flat (legacy)", () => {
    const quota = toSimulationQuota({
      limit: 1,
      used: 0,
      remaining: 1,
      unlimited: false,
      allowed: true,
      reset_at: "2026-06-01T00:00:00Z",
    });

    expect(quota.remaining).toBe(1);
    expect(quota.allowed).toBe(true);
  });

  it("preserva remaining nulo para premium (unlimited)", () => {
    const quota = toSimulationQuota({
      data: {
        limit: 1,
        used: 0,
        remaining: null,
        unlimited: true,
        allowed: true,
        reset_at: "2026-06-01T00:00:00Z",
      },
    });

    expect(quota.unlimited).toBe(true);
    expect(quota.remaining).toBeNull();
  });
});
