import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GOAL_AI_PROJECTION_CACHE_TTL_MS,
  buildGoalAIProjectionCacheKey,
  useGoalAIProjectionMutation,
} from "./use-goal-ai-projection-mutation";
import type {
  GoalAIProjectionPayload,
  GoalAIProjectionResponseDto,
} from "~/features/goals/contracts/goal.dto";

const useMutationMock = vi.hoisted(() => vi.fn());
const getQueryDataMock = vi.hoisted(() => vi.fn());
const setQueryDataMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: (): {
    getQueryData: typeof getQueryDataMock;
    setQueryData: typeof setQueryDataMock;
  } => ({
    getQueryData: getQueryDataMock,
    setQueryData: setQueryDataMock,
  }),
}));

/**
 * Builds a projection mutation payload fixture.
 *
 * @returns Goal AI projection payload.
 */
const makePayload = (): GoalAIProjectionPayload => ({
  monthly_contribution: 1200,
  user_context: "Contexto enriquecido com transacoes recentes",
});

/**
 * Builds an AI projection response fixture.
 *
 * @returns Goal AI projection response.
 */
const makeResponse = (): GoalAIProjectionResponseDto => ({
  narrative: "A meta segue viavel com aporte mensal de R$ 1.200.",
  tokens_used: 420,
  cost_usd: 0.000062,
  model: "gpt-4o-mini",
  projection: {
    goal_id: "goal-001",
    current_amount: "10000.00",
    target_amount: "30000.00",
    remaining_amount: "20000.00",
    monthly_contribution: "1200.00",
    portfolio_monthly_return_rate: "0.008",
    portfolio_annual_return_rate_pct: "10.00",
    months_to_completion: 16,
    projected_completion_date: "2027-09-01",
    on_track: true,
    months_until_deadline: 18,
    suggested_monthly_contribution: null,
  },
});

describe("useGoalAIProjectionMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("builds a stable cache key from goal id and projection payload", () => {
    expect(buildGoalAIProjectionCacheKey("goal-001", makePayload())).toEqual([
      "goals",
      "goal-001",
      "ai-projection",
      1200,
      "Contexto enriquecido com transacoes recentes",
    ]);
  });

  it("calls client.generateGoalAIProjection and stores the response in a 1-hour cache", async () => {
    vi.setSystemTime(new Date("2026-05-17T12:00:00Z"));
    const response = makeResponse();
    const client = { generateGoalAIProjection: vi.fn().mockResolvedValue(response) };
    getQueryDataMock.mockReturnValue(undefined);

    const mutation = useGoalAIProjectionMutation(client as never) as unknown as {
      mutationFn: (vars: { goalId: string; payload: GoalAIProjectionPayload }) => Promise<GoalAIProjectionResponseDto>;
    };

    const result = await mutation.mutationFn({ goalId: "goal-001", payload: makePayload() });

    expect(client.generateGoalAIProjection).toHaveBeenCalledWith("goal-001", makePayload());
    expect(setQueryDataMock).toHaveBeenCalledWith(
      buildGoalAIProjectionCacheKey("goal-001", makePayload()),
      { data: response, cachedAt: Date.now() },
    );
    expect(result).toEqual(response);
  });

  it("returns cached data without calling the API when the cache is still fresh", async () => {
    vi.setSystemTime(new Date("2026-05-17T12:30:00Z"));
    const response = makeResponse();
    const client = { generateGoalAIProjection: vi.fn() };
    getQueryDataMock.mockReturnValue({
      data: response,
      cachedAt: Date.now() - GOAL_AI_PROJECTION_CACHE_TTL_MS + 1000,
    });

    const mutation = useGoalAIProjectionMutation(client as never) as unknown as {
      mutationFn: (vars: { goalId: string; payload: GoalAIProjectionPayload }) => Promise<GoalAIProjectionResponseDto>;
    };

    const result = await mutation.mutationFn({ goalId: "goal-001", payload: makePayload() });

    expect(client.generateGoalAIProjection).not.toHaveBeenCalled();
    expect(result).toEqual(response);
  });
});
