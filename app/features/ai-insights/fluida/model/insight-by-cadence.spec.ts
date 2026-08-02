import { describe, expect, it } from "vitest";

import type { AIInsightDTO } from "~/features/ai-insights/contracts/ai-insight";

import { previousMonthLabel, selectInsightForCadence } from "./insight-by-cadence";

/**
 * Builds a history item with only the fields the selector reads.
 *
 * @param overrides Partial DTO overrides.
 * @returns History item.
 */
function item(overrides: Partial<AIInsightDTO>): AIInsightDTO {
  return {
    id: "id-1",
    content: "",
    insight_type: "daily",
    period_label: "2026-08-01",
    period_start: "2026-08-01",
    period_end: "2026-08-01",
    model: "gpt-4o",
    tokens_used: 0,
    cost_usd: 0,
    created_at: "2026-08-01T03:00:00Z",
    ...overrides,
  } as AIInsightDTO;
}

describe("previousMonthLabel", () => {
  it("returns the previous month in YYYY-MM", () => {
    expect(previousMonthLabel(new Date("2026-08-01T12:00:00Z"))).toBe("2026-07");
  });

  it("rolls back across the year boundary", () => {
    expect(previousMonthLabel(new Date("2026-01-15T12:00:00Z"))).toBe("2025-12");
  });
});

describe("selectInsightForCadence", () => {
  const daily = item({ id: "d1", insight_type: "daily", created_at: "2026-08-01T03:00:00Z" });
  const olderDaily = item({ id: "d0", insight_type: "daily", created_at: "2026-07-22T03:00:00Z" });
  const weekly = item({
    id: "w1",
    insight_type: "weekly",
    period_label: "2026-W31",
    created_at: "2026-08-01T03:00:00Z",
  });
  const julyMonthly = item({
    id: "m-july",
    insight_type: "monthly",
    period_label: "2026-07",
    created_at: "2026-08-01T04:04:00Z",
  });
  const juneMonthly = item({
    id: "m-june",
    insight_type: "monthly",
    period_label: "2026-06",
    created_at: "2026-07-01T04:04:00Z",
  });

  const now = new Date("2026-08-01T12:00:00Z");

  it("picks the most recent daily insight", () => {
    const picked = selectInsightForCadence([olderDaily, daily, weekly], "daily", now);
    expect(picked?.id).toBe("d1");
  });

  it("picks the most recent weekly insight", () => {
    const picked = selectInsightForCadence([daily, weekly], "weekly", now);
    expect(picked?.id).toBe("w1");
  });

  it("picks the monthly closing of the previous month", () => {
    const picked = selectInsightForCadence([daily, juneMonthly, julyMonthly], "monthly", now);
    expect(picked?.id).toBe("m-july");
  });

  it("falls back to the latest monthly when the previous month has none", () => {
    const picked = selectInsightForCadence([daily, juneMonthly], "monthly", now);
    expect(picked?.id).toBe("m-june");
  });

  it("never returns a recap when asked for monthly", () => {
    const recap = item({
      id: "r1",
      insight_type: "recap",
      period_label: "2026-07-recap",
      created_at: "2026-08-01T05:00:00Z",
    });
    const picked = selectInsightForCadence([recap], "monthly", now);
    expect(picked).toBeNull();
  });

  it("returns null when the cadence has no insight at all", () => {
    expect(selectInsightForCadence([weekly], "daily", now)).toBeNull();
    expect(selectInsightForCadence([], "monthly", now)).toBeNull();
  });

  it("matches on period_type when insight_type disagrees", () => {
    const byPeriodType = item({
      id: "p1",
      insight_type: "recap",
      period_type: "weekly",
      period_label: "2026-W31",
    });
    expect(selectInsightForCadence([byPeriodType], "weekly", now)?.id).toBe("p1");
  });
});
