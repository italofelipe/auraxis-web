import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { WeeklySnapshotApiClient } from "./weekly-snapshot.client";
import type { WeeklySummaryNarrativeDto } from "../contracts/weekly-snapshot.dto";

const DTO: WeeklySummaryNarrativeDto = {
  narrative: "Resumo da semana.",
  summary: {
    current_week: { start: "2026-06-01", end: "2026-06-07", income: 5000, expense: 1200, balance: 3800, transaction_count: 14 },
    previous_week: { start: "2026-05-25", end: "2026-05-31", income: 5000, expense: 1090, balance: 3910, transaction_count: 11 },
    comparison: { income_delta: 0, income_delta_percent: 0, expense_delta: 110, expense_delta_percent: 10.09, balance_delta: -110, balance_delta_percent: -2.81 },
  },
};

/**
 * @param data Response body to resolve.
 * @returns A fake Axios instance exposing a stubbed get().
 */
function fakeHttp(data: unknown): AxiosInstance {
  return { get: vi.fn().mockResolvedValue({ data, headers: {} }) } as unknown as AxiosInstance;
}

describe("WeeklySnapshotApiClient", () => {
  it("maps an enveloped payload to the domain model", async () => {
    const client = new WeeklySnapshotApiClient(fakeHttp({ success: true, data: DTO }));
    const snapshot = await client.getWeeklySnapshot();
    expect(snapshot.currentExpense).toBe(1200);
    expect(snapshot.expenseDeltaPercent).toBe(10.09);
  });

  it("tolerates a flat (legacy) payload", async () => {
    const client = new WeeklySnapshotApiClient(fakeHttp(DTO));
    const snapshot = await client.getWeeklySnapshot();
    expect(snapshot.narrative).toBe("Resumo da semana.");
    expect(snapshot.transactionCount).toBe(14);
  });
});
