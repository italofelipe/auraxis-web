import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useGoalProjectionQuery } from "./use-goal-projection-query";
import type { GoalsClient } from "~/features/goals/services/goals.client";
import type {
  GoalProjectionResponseDto,
  GoalProjectionDto,
} from "~/features/goals/contracts/goal.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal GoalProjectionDto fixture.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete GoalProjectionDto fixture.
 */
const makeProjectionDto = (
  overrides: Partial<GoalProjectionDto> = {},
): GoalProjectionDto => ({
  goal_id: "goal-001",
  current_amount: "5000.00",
  target_amount: "20000.00",
  remaining_amount: "15000.00",
  monthly_contribution: "800.00",
  portfolio_monthly_return_rate: "0.009489",
  portfolio_annual_return_rate_pct: "12.00",
  months_to_completion: 16,
  projected_completion_date: "2027-06-01",
  on_track: true,
  months_until_deadline: 24,
  suggested_monthly_contribution: null,
  ...overrides,
});

/**
 * Builds a minimal GoalProjectionResponseDto fixture.
 *
 * @returns A complete GoalProjectionResponseDto fixture.
 */
const makeResponseDto = (): GoalProjectionResponseDto => ({
  goal: {
    id: "goal-001",
    name: "Reserva de emergência",
    description: null,
    target_amount: 20000,
    current_amount: 5000,
    target_date: "2028-01-01",
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
  },
  projection: makeProjectionDto(),
});

describe("useGoalProjectionQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables the query when goalId is null", () => {
    const mockClient = {
      getGoalProjection: vi.fn(),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: Record<string, unknown>) => opts,
    );

    const goalId = ref<string | null>(null);
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      enabled: { value: boolean } | boolean;
    };

    const enabledValue =
      typeof result.enabled === "object" && result.enabled !== null
        ? (result.enabled as { value: boolean }).value
        : result.enabled;

    expect(enabledValue).toBe(false);
    expect(mockClient.getGoalProjection).not.toHaveBeenCalled();
  });

  it("calls client.getGoalProjection with the correct id when enabled", async () => {
    const mockClient = {
      getGoalProjection: vi.fn().mockResolvedValue(makeResponseDto()),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalProjectionResponseDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalProjectionResponseDto>;
    };

    const data = await result.queryFn();

    expect(mockClient.getGoalProjection).toHaveBeenCalledWith("goal-001");
    expect(data.projection.goal_id).toBe("goal-001");
  });

  it("uses the canonical query key pattern [goals, goalId, projection]", () => {
    const mockClient = {
      getGoalProjection: vi.fn(),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: Record<string, unknown>) => opts,
    );

    const goalId = ref<string | null>("goal-003");
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      queryKey: readonly ["goals", typeof goalId, "projection"];
    };

    expect(result.queryKey[0]).toBe("goals");
    expect(result.queryKey[2]).toBe("projection");
  });

  it("returns full GoalProjectionResponseDto on success", async () => {
    const response = makeResponseDto();
    const mockClient = {
      getGoalProjection: vi.fn().mockResolvedValue(response),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalProjectionResponseDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalProjectionResponseDto>;
    };

    const data = await result.queryFn();

    expect(data.projection.monthly_contribution).toBe("800.00");
    expect(data.projection.months_to_completion).toBe(16);
    expect(data.projection.on_track).toBe(true);
    expect(data.projection.portfolio_annual_return_rate_pct).toBe("12.00");
  });

  it("propagates errors from client.getGoalProjection", async () => {
    const mockClient = {
      getGoalProjection: vi
        .fn()
        .mockRejectedValue(new Error("network failure")),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalProjectionResponseDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalProjectionResponseDto>;
    };

    await expect(result.queryFn()).rejects.toThrow("network failure");
  });

  it("handles off-track projection with suggested contribution", async () => {
    const offTrack = makeProjectionDto({
      on_track: false,
      suggested_monthly_contribution: "1200.00",
      months_until_deadline: 12,
    });
    const mockClient = {
      getGoalProjection: vi.fn().mockResolvedValue({
        goal: makeResponseDto().goal,
        projection: offTrack,
      }),
    } as unknown as GoalsClient;

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalProjectionResponseDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalProjectionQuery(goalId, mockClient) as unknown as {
      queryFn: () => Promise<GoalProjectionResponseDto>;
    };

    const data = await result.queryFn();

    expect(data.projection.on_track).toBe(false);
    expect(data.projection.suggested_monthly_contribution).toBe("1200.00");
  });
});
