import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useGoalContributionsQuery } from "./use-goal-contributions-query";
import type { GoalsClient } from "~/features/goals/services/goals.client";
import type { GoalContributionListDto } from "~/features/goals/contracts/contributions.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal contributions list fixture.
 *
 * @returns A complete GoalContributionListDto fixture.
 */
const makeListDto = (): GoalContributionListDto => ({
  items: [
    {
      id: "c-1",
      goal_id: "goal-001",
      amount: 250,
      note: "Aporte",
      occurred_at: "2026-06-01",
      created_at: "2026-06-01T10:00:00Z",
    },
  ],
  pagination: { total: 1, page: 1, per_page: 10, pages: 1 },
});

describe("useGoalContributionsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables the query when goalId is null", () => {
    const client = { listContributions: vi.fn() } as unknown as GoalsClient;
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const goalId = ref<string | null>(null);
    const result = useGoalContributionsQuery(goalId, 1, client) as unknown as {
      enabled: { value: boolean } | boolean;
    };

    const enabledValue =
      typeof result.enabled === "object" && result.enabled !== null
        ? (result.enabled as { value: boolean }).value
        : result.enabled;

    expect(enabledValue).toBe(false);
    expect(client.listContributions).not.toHaveBeenCalled();
  });

  it("uses the canonical [goals, goalId, contributions, page] query key", () => {
    const client = { listContributions: vi.fn() } as unknown as GoalsClient;
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const goalId = ref<string | null>("goal-001");
    const result = useGoalContributionsQuery(goalId, ref(2), client) as unknown as {
      queryKey: readonly [string, unknown, string, { value: number }];
    };

    expect(result.queryKey[0]).toBe("goals");
    expect(result.queryKey[2]).toBe("contributions");
    expect(result.queryKey[3]?.value).toBe(2);
  });

  it("calls client.listContributions with the page and default per_page", async () => {
    const client = {
      listContributions: vi.fn().mockResolvedValue(makeListDto()),
    } as unknown as GoalsClient;
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalContributionListDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalContributionsQuery(goalId, ref(3), client) as unknown as {
      queryFn: () => Promise<GoalContributionListDto>;
    };

    const data = await result.queryFn();

    expect(client.listContributions).toHaveBeenCalledWith("goal-001", {
      page: 3,
      perPage: 10,
    });
    expect(data.items[0]?.amount).toBe(250);
  });

  it("propagates errors from client.listContributions", async () => {
    const client = {
      listContributions: vi.fn().mockRejectedValue(new Error("boom")),
    } as unknown as GoalsClient;
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<GoalContributionListDto> }) => opts,
    );

    const goalId = ref<string | null>("goal-001");
    const result = useGoalContributionsQuery(goalId, 1, client) as unknown as {
      queryFn: () => Promise<GoalContributionListDto>;
    };

    await expect(result.queryFn()).rejects.toThrow("boom");
  });
});
