import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosInstance } from "axios";

import { GoalsClient } from "./goals.client";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

/**
 * Creates a minimal valid GoalDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete GoalDto fixture.
 */
const makeGoalDto = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: "goal-001",
  name: "Reserva de emergência",
  description: "6 meses de despesas.",
  target_amount: 30000,
  current_amount: 18500,
  target_date: "2026-09-30",
  status: "active",
  created_at: "2025-11-01T10:00:00Z",
  ...overrides,
});

describe("GoalsClient", () => {
  let http: AxiosInstance;
  let client: GoalsClient;

  beforeEach(() => {
    http = { get: vi.fn() } as unknown as AxiosInstance;
    client = new GoalsClient(http);
  });

  describe("listGoals", () => {
    it("calls GET /goals and returns the data array", async () => {
      const goals: GoalDto[] = [makeGoalDto(), makeGoalDto({ id: "goal-002", name: "Viagem" })];
      vi.mocked(http.get).mockResolvedValueOnce({ data: goals });

      const result = await client.listGoals();

      expect(http.get).toHaveBeenCalledWith("/goals");
      expect(result).toEqual(goals);
    });

    it("returns an empty array when the API returns no goals", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: [] });

      const result = await client.listGoals();

      expect(result).toEqual([]);
    });
  });
});
