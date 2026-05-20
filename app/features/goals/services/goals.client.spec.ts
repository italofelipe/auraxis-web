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
    http = { get: vi.fn(), post: vi.fn(), patch: vi.fn() } as unknown as AxiosInstance;
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

    it("normalizes API title into the UI name field", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({
        data: [
          {
            id: "goal-title-1",
            title: "PC AMD",
            description: null,
            target_amount: 30000,
            current_amount: 1500,
            target_date: "2027-05-20",
            status: "active",
            created_at: "2026-05-20T10:00:00Z",
          },
        ],
      });

      const [goal] = await client.listGoals();

      expect(goal?.name).toBe("PC AMD");
    });
  });

  describe("createGoal", () => {
    it("sends title to the API instead of the UI-only name field", async () => {
      vi.mocked(http.post).mockResolvedValueOnce({
        data: {
          id: "goal-created-1",
          title: "PC AMD",
          description: "9950X3D",
          target_amount: 30000,
          current_amount: 1500,
          target_date: "2027-05-20",
          status: "active",
          created_at: "2026-05-20T10:00:00Z",
        },
      });

      const result = await client.createGoal({
        name: "PC AMD",
        description: "9950X3D",
        target_amount: 30000,
        current_amount: 1500,
        target_date: "2027-05-20",
      });

      expect(http.post).toHaveBeenCalledWith("/goals", {
        title: "PC AMD",
        description: "9950X3D",
        target_amount: 30000,
        current_amount: 1500,
        target_date: "2027-05-20",
      });
      expect(JSON.stringify(vi.mocked(http.post).mock.calls[0]?.[1])).not.toContain("\"name\"");
      expect(result.name).toBe("PC AMD");
    });
  });

  describe("updateGoal", () => {
    it("maps partial name updates to title without sending name", async () => {
      vi.mocked(http.patch).mockResolvedValueOnce({
        data: {
          id: "goal-001",
          title: "Reserva revisada",
          description: "6 meses de despesas.",
          target_amount: 40000,
          current_amount: 18500,
          target_date: "2026-09-30",
          status: "active",
          created_at: "2025-11-01T10:00:00Z",
        },
      });

      const result = await client.updateGoal("goal-001", {
        name: "Reserva revisada",
        target_amount: 40000,
      });

      expect(http.patch).toHaveBeenCalledWith("/goals/goal-001", {
        title: "Reserva revisada",
        target_amount: 40000,
      });
      expect(JSON.stringify(vi.mocked(http.patch).mock.calls[0]?.[1])).not.toContain("\"name\"");
      expect(result.name).toBe("Reserva revisada");
    });
  });

  describe("generateGoalAIProjection", () => {
    it("posts the AI context to POST /ai/goals/:id/projection and unwraps a v2 envelope", async () => {
      const response = {
        narrative: "Aumente o aporte para manter a meta no prazo.",
        tokens_used: 431,
        cost_usd: 0.000064,
        model: "gpt-4o-mini",
        projection: {
          goal_id: "goal-001",
          current_amount: "18500.00",
          target_amount: "30000.00",
          remaining_amount: "11500.00",
          monthly_contribution: "1200.00",
          portfolio_monthly_return_rate: "0.008",
          portfolio_annual_return_rate_pct: "10.00",
          months_to_completion: 9,
          projected_completion_date: "2026-02-01",
          on_track: true,
          months_until_deadline: 10,
          suggested_monthly_contribution: null,
        },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: { success: true, data: response } });

      const result = await client.generateGoalAIProjection("goal-001", {
        monthly_contribution: 1200,
        user_context: "Contexto livre do usuário",
      });

      expect(http.post).toHaveBeenCalledWith("/ai/goals/goal-001/projection", {
        monthly_contribution: 1200,
        user_context: "Contexto livre do usuário",
      });
      expect(result).toEqual(response);
    });
  });
});
