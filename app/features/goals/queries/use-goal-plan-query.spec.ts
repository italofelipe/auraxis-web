import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useGoalPlanQuery } from "./use-goal-plan-query";
import type { GoalsClient } from "~/features/goals/services/goals.client";
import type { GoalPlanDto } from "~/features/goals/contracts/goal.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal GoalPlanDto fixture for testing.
 *
 * @returns GoalPlanDto fixture with default values.
 */
const makeGoalPlanDto = (): GoalPlanDto => ({
  required_monthly_contribution: 1500,
  months_remaining: 12,
  projected_completion_date: "2027-03-28",
  is_on_track: true,
});

const MOCK_GOAL_PLAN = makeGoalPlanDto();

describe("useGoalPlanQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables the query when goalId is null", () => {
    const mockClient = {
      getGoalPlan: vi.fn(),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: Record<string, unknown>) => opts,
    );

    const goalId = ref<string | null>(null);
    const result = useGoalPlanQuery(goalId, mockClient) as unknown as {
      enabled: { value: boolean } | boolean;
    };

    const enabledValue =
      typeof result.enabled === "object" && result.enabled !== null
        ? (result.enabled as { value: boolean }).value
        : result.enabled;

    expect(enabledValue).toBe(false);
    expect(mockClient.getGoalPlan).not.toHaveBeenCalled();
  });

  it("calls client.getGoalPlan with the correct id when enabled", async () => {
    const mockClient = {
      getGoalPlan: vi.fn().mockResolvedValue(MOCK_GOAL_PLAN),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalPlanDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalPlanQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalPlanDto>;
    };

    const data = await result.queryFn();

    expect(mockClient.getGoalPlan).toHaveBeenCalledWith("goal-001");
    expect(data).toEqual(MOCK_GOAL_PLAN);
  });

  it("returns GoalPlanDto on success", async () => {
    const plan = makeGoalPlanDto();
    const mockClient = {
      getGoalPlan: vi.fn().mockResolvedValue(plan),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalPlanDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-002");
    const result = useGoalPlanQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalPlanDto>;
    };

    const data = await result.queryFn();

    expect(data.required_monthly_contribution).toBe(1500);
    expect(data.months_remaining).toBe(12);
    expect(data.is_on_track).toBe(true);
  });

  it("uses the canonical query key pattern", () => {
    const mockClient = {
      getGoalPlan: vi.fn(),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: Record<string, unknown>) => opts,
    );

    const goalId = ref<string | null>("goal-003");
    const result = useGoalPlanQuery(goalId, mockClient) as unknown as {
      queryKey: readonly ["goals", typeof goalId, "plan"];
    };

    expect(result.queryKey[0]).toBe("goals");
    expect(result.queryKey[2]).toBe("plan");
  });

  it("propagates error from client.getGoalPlan without catching it", async () => {
    const mockClient = {
      getGoalPlan: vi.fn().mockRejectedValue(new Error("network error")),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalPlanDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalPlanQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalPlanDto>;
    };

    await expect(result.queryFn()).rejects.toThrow("network error");
  });
});
