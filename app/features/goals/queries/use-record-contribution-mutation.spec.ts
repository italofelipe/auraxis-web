import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useRecordContributionMutation,
  type RecordContributionResult,
} from "./use-record-contribution-mutation";
import type { GoalsClient } from "~/features/goals/services/goals.client";
import type { RecordGoalContributionPayload } from "~/features/goals/contracts/contributions.dto";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

type CapturedOptions = {
  invalidates?: ReadonlyArray<ReadonlyArray<unknown>>;
};

describe("useRecordContributionMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createApiMutationMock.mockImplementation(
      (
        fn: (p: RecordGoalContributionPayload) => Promise<RecordContributionResult>,
        opts: CapturedOptions,
      ) => ({ mutationFn: fn, options: opts }),
    );
  });

  it("calls client.recordContribution with the goal id and payload", async () => {
    const result: RecordContributionResult = {
      goal: {
        id: "goal-001",
        name: "Reserva",
        description: null,
        target_amount: 30000,
        current_amount: 18750,
        target_date: "2026-12-31",
        status: "active",
        created_at: "2026-01-01T00:00:00Z",
      },
      contribution: {
        id: "c-1",
        goal_id: "goal-001",
        amount: 250,
        note: null,
        occurred_at: "2026-06-01",
        created_at: "2026-06-01T10:00:00Z",
      },
    };
    const client = {
      recordContribution: vi.fn().mockResolvedValue(result),
    } as unknown as GoalsClient;

    const hook = useRecordContributionMutation("goal-001", client) as unknown as {
      mutationFn: (p: RecordGoalContributionPayload) => Promise<RecordContributionResult>;
    };

    const data = await hook.mutationFn({ amount: 250 });

    expect(client.recordContribution).toHaveBeenCalledWith("goal-001", { amount: 250 });
    expect(data.contribution.amount).toBe(250);
  });

  it("invalidates the goals list, contributions, and projection caches", () => {
    const client = { recordContribution: vi.fn() } as unknown as GoalsClient;

    useRecordContributionMutation("goal-xyz", client);

    const opts = createApiMutationMock.mock.calls[0]?.[1] as CapturedOptions;
    expect(opts.invalidates).toEqual([
      ["goals", "list"],
      ["goals", "goal-xyz", "contributions"],
      ["goals", "goal-xyz", "projection"],
    ]);
  });
});
