import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGenerateAIInsight } from "./use-generate-ai-insight";
import type { GenerateAIInsightVariables } from "~/features/ai-insights/model/ai-insight";

const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn(() => ({ invalidateQueries: vi.fn() })));

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

describe("useGenerateAIInsight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("registers a mutation that calls the AI insights client", async () => {
    const client = {
      generateSpendingInsight: vi.fn().mockResolvedValue({
        insights: "[]",
        month: "2026-05",
        model: "gpt-4o-mini",
        tokens_used: 120,
        cost_usd: 0.00002,
        cached: false,
        callsRemaining: 1,
      }),
    };

    const mutation = useGenerateAIInsight(client as never) as unknown as {
      mutationFn: (variables?: GenerateAIInsightVariables) => Promise<unknown>;
    };

    await mutation.mutationFn({ month: "2026-05" });

    expect(client.generateSpendingInsight).toHaveBeenCalledWith("2026-05");
  });

  it("invalidates current insight surfaces after a successful generation", async () => {
    const invalidateQueries = vi.fn();
    const client = { generateSpendingInsight: vi.fn() };

    const mutation = useGenerateAIInsight(client as never, { invalidateQueries }) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["ai-insights", "history"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "overview"] });
  });
});
