import { describe, expect, it } from "vitest";

import {
  buildSnapshotSignature,
  isSnapshotUnseen,
  mapWeeklySnapshotDto,
} from "./weekly-snapshot";
import type { WeeklySummaryNarrativeDto } from "../contracts/weekly-snapshot.dto";

const DTO: WeeklySummaryNarrativeDto = {
  narrative: "Esta semana você gastou R$ 1.200, 10% a mais que na semana passada.",
  tokens_used: 280,
  cost_usd: 0.000042,
  model: "gpt-4o-mini",
  summary: {
    current_week: { start: "2026-06-01", end: "2026-06-07", income: 5000, expense: 1200, balance: 3800, transaction_count: 14 },
    previous_week: { start: "2026-05-25", end: "2026-05-31", income: 5000, expense: 1090, balance: 3910, transaction_count: 11 },
    comparison: {
      income_delta: 0,
      income_delta_percent: 0,
      expense_delta: 110,
      expense_delta_percent: 10.09,
      balance_delta: -110,
      balance_delta_percent: -2.81,
    },
  },
};

describe("mapWeeklySnapshotDto", () => {
  it("maps the narrative and current-week totals", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(snapshot.narrative).toContain("Esta semana");
    expect(snapshot.currentExpense).toBe(1200);
    expect(snapshot.currentIncome).toBe(5000);
    expect(snapshot.currentBalance).toBe(3800);
    expect(snapshot.transactionCount).toBe(14);
    expect(snapshot.weekStart).toBe("2026-06-01");
    expect(snapshot.weekEnd).toBe("2026-06-07");
  });

  it("maps the week-over-week comparison deltas", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(snapshot.expenseDeltaPercent).toBe(10.09);
    expect(snapshot.balanceDeltaPercent).toBe(-2.81);
  });
});

describe("buildSnapshotSignature", () => {
  it("is stable for the same snapshot", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(buildSnapshotSignature(snapshot)).toBe(buildSnapshotSignature(snapshot));
  });

  it("changes when the week or expense changes", () => {
    const a = mapWeeklySnapshotDto(DTO);
    const b = mapWeeklySnapshotDto({
      ...DTO,
      summary: { ...DTO.summary, current_week: { ...DTO.summary.current_week, expense: 1500 } },
    });
    expect(buildSnapshotSignature(a)).not.toBe(buildSnapshotSignature(b));
  });
});

describe("isSnapshotUnseen", () => {
  it("is unseen when no signature was stored", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(isSnapshotUnseen(snapshot, null)).toBe(true);
  });

  it("is seen when the stored signature matches", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(isSnapshotUnseen(snapshot, buildSnapshotSignature(snapshot))).toBe(false);
  });

  it("is unseen when the stored signature differs", () => {
    const snapshot = mapWeeklySnapshotDto(DTO);
    expect(isSnapshotUnseen(snapshot, "stale-signature")).toBe(true);
  });
});
