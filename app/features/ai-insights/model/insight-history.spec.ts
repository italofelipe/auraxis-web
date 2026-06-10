import { describe, expect, it } from "vitest";

import { splitTodayAndPast } from "./insight-history";
import type { AIInsightDTO } from "~/features/ai-insights/contracts/ai-insight";

/**
 * Builds a minimal AIInsightDTO with a given id and created_at for tests.
 *
 * @param id Insight id.
 * @param createdAt ISO datetime string.
 * @returns Test insight DTO.
 */
const makeInsight = (id: string, createdAt: string): AIInsightDTO => ({
  id,
  content: "{}",
  insight_type: "daily",
  period_label: createdAt.slice(0, 10),
  period_start: createdAt.slice(0, 10),
  period_end: createdAt.slice(0, 10),
  model: "gpt-4o-mini",
  tokens_used: 100,
  cost_usd: 0.0001,
  created_at: createdAt,
});

const TODAY = "2026-06-03";

describe("splitTodayAndPast", () => {
  it("splits today's insight from past insights when a today item is present", () => {
    const items = [
      makeInsight("today", `${TODAY}T10:00:00Z`),
      makeInsight("yesterday", "2026-06-02T10:00:00Z"),
      makeInsight("older", "2026-06-01T10:00:00Z"),
    ];

    const result = splitTodayAndPast(items, TODAY);

    expect(result.todayInsight?.id).toBe("today");
    expect(result.past.map((item) => item.id)).toEqual(["yesterday", "older"]);
  });

  it("picks the most recent today insight when multiple exist regardless of input order", () => {
    const items = [
      makeInsight("today-early", `${TODAY}T08:00:00Z`),
      makeInsight("today-late", `${TODAY}T18:00:00Z`),
      makeInsight("yesterday", "2026-06-02T10:00:00Z"),
    ];

    const result = splitTodayAndPast(items, TODAY);

    expect(result.todayInsight?.id).toBe("today-late");
    expect(result.past.map((item) => item.id)).toEqual(["today-early", "yesterday"]);
  });

  it("prefers a rich today insight over a more recent spending_patterns headline", () => {
    const patterns = {
      ...makeInsight("today-patterns", `${TODAY}T20:00:00Z`),
      insight_type: "spending_patterns" as never,
    };
    const rich = makeInsight("today-daily", `${TODAY}T07:00:00Z`);

    const result = splitTodayAndPast([patterns, rich], TODAY);

    expect(result.todayInsight?.id).toBe("today-daily");
    // The patterns insight still surfaces in history, just not as the headline.
    expect(result.past.map((item) => item.id)).toContain("today-patterns");
  });

  it("falls back to the spending_patterns insight when it is the only one today", () => {
    const patterns = {
      ...makeInsight("today-patterns", `${TODAY}T20:00:00Z`),
      insight_type: "spending_patterns" as never,
    };

    const result = splitTodayAndPast([patterns], TODAY);

    expect(result.todayInsight?.id).toBe("today-patterns");
  });

  it("returns null today insight and keeps every item in past when none was generated today", () => {
    const items = [
      makeInsight("yesterday", "2026-06-02T10:00:00Z"),
      makeInsight("older", "2026-06-01T10:00:00Z"),
    ];

    const result = splitTodayAndPast(items, TODAY);

    expect(result.todayInsight).toBeNull();
    expect(result.past.map((item) => item.id)).toEqual(["yesterday", "older"]);
  });

  it("returns null today insight and an empty past list for an empty input", () => {
    const result = splitTodayAndPast([], TODAY);

    expect(result.todayInsight).toBeNull();
    expect(result.past).toEqual([]);
  });

  it("orders past insights newest-first even when input is unsorted", () => {
    const items = [
      makeInsight("older", "2026-06-01T10:00:00Z"),
      makeInsight("today", `${TODAY}T10:00:00Z`),
      makeInsight("yesterday", "2026-06-02T10:00:00Z"),
    ];

    const result = splitTodayAndPast(items, TODAY);

    expect(result.todayInsight?.id).toBe("today");
    expect(result.past.map((item) => item.id)).toEqual(["yesterday", "older"]);
  });
});
