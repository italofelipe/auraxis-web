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

describe("GoalsClient contributions", () => {
  let http: AxiosInstance;
  let client: GoalsClient;

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn() } as unknown as AxiosInstance;
    client = new GoalsClient(http);
  });

  describe("recordContribution", () => {
    it("serializes the signed amount to a decimal string and posts it", async () => {
      vi.mocked(http.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            goal: { ...makeGoalDto({ current_amount: 18750 }), title: "Reserva de emergência" },
            contribution: {
              id: "c-1",
              goal_id: "goal-001",
              amount: "250.00",
              note: "Aporte mensal",
              occurred_at: "2026-06-01",
              created_at: "2026-06-01T10:00:00Z",
            },
          },
        },
      });

      const result = await client.recordContribution("goal-001", {
        amount: 250,
        occurred_at: "2026-06-01",
        note: "Aporte mensal",
      });

      expect(http.post).toHaveBeenCalledWith("/goals/goal-001/contributions", {
        amount: "250.00",
        occurred_at: "2026-06-01",
        note: "Aporte mensal",
      });
      expect(result.contribution.amount).toBe(250);
      expect(result.contribution.note).toBe("Aporte mensal");
      expect(result.goal.name).toBe("Reserva de emergência");
    });

    it("serializes a negative (withdrawal) amount to a signed decimal string", async () => {
      vi.mocked(http.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            goal: makeGoalDto(),
            contribution: {
              id: "c-2",
              goal_id: "goal-001",
              amount: "-50.00",
              note: null,
              occurred_at: "2026-06-02",
              created_at: "2026-06-02T10:00:00Z",
            },
          },
        },
      });

      const result = await client.recordContribution("goal-001", { amount: -50 });

      expect(http.post).toHaveBeenCalledWith("/goals/goal-001/contributions", {
        amount: "-50.00",
      });
      expect(result.contribution.amount).toBe(-50);
    });

    it("propagates an INSUFFICIENT_BALANCE error from the API", async () => {
      vi.mocked(http.post).mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { error: { code: "INSUFFICIENT_BALANCE" } } },
      });

      await expect(
        client.recordContribution("goal-001", { amount: -9999 }),
      ).rejects.toMatchObject({
        response: { data: { error: { code: "INSUFFICIENT_BALANCE" } } },
      });
    });
  });

  describe("listContributions", () => {
    it("requests the paginated envelope and coerces amounts to numbers", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [
              {
                id: "c-1",
                goal_id: "goal-001",
                amount: "250.00",
                note: "Aporte",
                occurred_at: "2026-06-01",
                created_at: "2026-06-01T10:00:00Z",
              },
              {
                id: "c-2",
                goal_id: "goal-001",
                amount: "-50.00",
                note: null,
                occurred_at: "2026-05-20",
                created_at: "2026-05-20T10:00:00Z",
              },
            ],
          },
          meta: { pagination: { total: 12, page: 1, per_page: 10, pages: 2 } },
        },
      });

      const result = await client.listContributions("goal-001", { page: 1, perPage: 10 });

      expect(http.get).toHaveBeenCalledWith("/goals/goal-001/contributions", {
        params: { page: 1, per_page: 10 },
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.amount).toBe(250);
      expect(result.items[1]?.amount).toBe(-50);
      expect(result.pagination).toEqual({ total: 12, page: 1, per_page: 10, pages: 2 });
    });

    it("falls back to sane pagination defaults when meta is absent", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({
        data: { success: true, data: { items: [] } },
      });

      const result = await client.listContributions("goal-001", { page: 2, perPage: 5 });

      expect(result.items).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 2, per_page: 5, pages: 1 });
    });
  });
});
