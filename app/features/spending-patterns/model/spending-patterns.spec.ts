import { describe, expect, it } from "vitest";

import {
  buildTransactionInputs,
  mapSpendingPatternsLatest,
  mapSpendingPatternsResponse,
  severityRank,
} from "./spending-patterns";
import type {
  SpendingPatternsLatestResponseDto,
  SpendingPatternsResponseDto,
} from "../contracts/spending-patterns.dto";

describe("spending-patterns model", () => {
  it("ranks severities high > medium > low", () => {
    expect(severityRank("high")).toBeGreaterThan(severityRank("medium"));
    expect(severityRank("medium")).toBeGreaterThan(severityRank("low"));
  });

  it("maps and sorts patterns by descending severity", () => {
    const dto: SpendingPatternsResponseDto = {
      model: "stub",
      generated_count: 3,
      patterns: [
        { description: "A", frequency: "x", average_value: 10, suggested_action: "y", severity: "low" },
        { description: "B", frequency: "x", average_value: 20, suggested_action: "y", severity: "high" },
        { description: "C", frequency: "x", average_value: 30, suggested_action: "y", severity: "medium" },
      ],
    };
    const patterns = mapSpendingPatternsResponse(dto);
    expect(patterns.map((p) => p.severity)).toEqual(["high", "medium", "low"]);
    expect(patterns[0]?.averageValue).toBe(20);
  });

  describe("buildTransactionInputs", () => {
    const txs = [
      { amount: "12.50", type: "expense" as const, due_date: "2026-05-01", title: "Café" },
      { amount: "3000.00", type: "income" as const, due_date: "2026-05-05", title: "Salário" },
      { amount: "0", type: "expense" as const, due_date: "2026-05-02", title: "Zero" },
      { amount: "abc", type: "expense" as const, due_date: "2026-05-03", title: "NaN" },
      { amount: "80.00", type: "expense" as const, due_date: "2026-05-04", title: "Bar" },
    ];

    it("keeps only positive-amount expenses", () => {
      const inputs = buildTransactionInputs(txs);
      expect(inputs).toHaveLength(2);
      expect(inputs.map((i) => i.category)).toEqual(["Café", "Bar"]);
      expect(inputs.every((i) => i.kind === "expense")).toBe(true);
    });

    it("parses amount and carries the date", () => {
      const inputs = buildTransactionInputs(txs);
      expect(inputs[0]).toMatchObject({ amount: 12.5, occurred_on: "2026-05-01" });
    });
  });

  describe("mapSpendingPatternsLatest", () => {
    it("maps and severity-sorts the cached read-only payload", () => {
      const dto: SpendingPatternsLatestResponseDto = {
        patterns: [
          { description: "Low", frequency: "f", average_value: 1, suggested_action: "a", severity: "low" },
          { description: "High", frequency: "f", average_value: 2, suggested_action: "a", severity: "high" },
        ],
        generated_at: "2026-06-05T06:00:00",
        period_label: "2026-06-05",
        model: "v2",
        cost_usd: 0,
        tokens_used: 0,
      };
      const result = mapSpendingPatternsLatest(dto);
      expect(result.generatedAt).toBe("2026-06-05T06:00:00");
      expect(result.patterns.map((p) => p.severity)).toEqual(["high", "low"]);
    });

    it("returns an empty radar with null generatedAt when the cron has not run", () => {
      const result = mapSpendingPatternsLatest({
        patterns: [],
        generated_at: null,
        period_label: null,
        model: "",
        cost_usd: 0,
        tokens_used: 0,
      });
      expect(result.patterns).toEqual([]);
      expect(result.generatedAt).toBeNull();
    });
  });
});
