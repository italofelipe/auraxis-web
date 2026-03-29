import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGoalsQuery } from "./use-goals-query";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal GoalDto fixture for testing.
 *
 * @returns GoalDto fixture with default values.
 */
const makeGoalDto = (): GoalDto => ({
  id: "goal-001",
  name: "Reserva de emergência",
  description: null,
  target_amount: 30000,
  current_amount: 10000,
  target_date: "2026-12-31",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
});

describe("useGoalsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical goals list query key", () => {
    const client = { listGoals: vi.fn().mockResolvedValue([makeGoalDto()]) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useGoalsQuery(client as never) as unknown as {
      queryKey: readonly ["goals", "list"];
    };

    expect(query.queryKey).toEqual(["goals", "list"]);
  });

  it("calls client.listGoals and returns the goals array", async () => {
    const goals = [makeGoalDto()];
    const client = { listGoals: vi.fn().mockResolvedValue(goals) };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<GoalDto[]> }) => opts);

    const query = useGoalsQuery(client as never) as unknown as {
      queryFn: () => Promise<GoalDto[]>;
    };

    const result = await query.queryFn();

    expect(client.listGoals).toHaveBeenCalledOnce();
    expect(result).toEqual(goals);
  });

  it("propagates error from client.listGoals without catching it", async () => {
    const client = {
      listGoals: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<GoalDto[]> }) => opts);

    const query = useGoalsQuery(client as never) as unknown as {
      queryFn: () => Promise<GoalDto[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
