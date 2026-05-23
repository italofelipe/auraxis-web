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
      generateInsight: vi.fn().mockResolvedValue({
        summary: "Resumo diário",
        items: [],
        period_type: "daily",
        period_label: "2026-05-18",
        period_start: "2026-05-18",
        period_end: "2026-05-18",
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

    await mutation.mutationFn({ periodType: "daily", anchorDate: "2026-05-18" });

    expect(client.generateInsight).toHaveBeenCalledWith({
      periodType: "daily",
      anchorDate: "2026-05-18",
    });
  });

  it("defaults generation to a daily insight when no variables are provided", async () => {
    const client = { generateInsight: vi.fn() };

    const mutation = useGenerateAIInsight(client as never) as unknown as {
      mutationFn: (variables?: GenerateAIInsightVariables) => Promise<unknown>;
    };

    await mutation.mutationFn();

    expect(client.generateInsight).toHaveBeenCalledWith({ periodType: "daily" });
  });

  it("forwards the source surface to the AI insights client", async () => {
    const client = { generateInsight: vi.fn() };

    const mutation = useGenerateAIInsight(client as never) as unknown as {
      mutationFn: (variables?: GenerateAIInsightVariables) => Promise<unknown>;
    };

    await mutation.mutationFn({
      periodType: "daily",
      sourceSurface: "transactions",
    } as never);

    expect(client.generateInsight).toHaveBeenCalledWith({
      periodType: "daily",
      sourceSurface: "transactions",
    });
  });

  it("invalidates current insight surfaces after a successful generation", async () => {
    const invalidateQueries = vi.fn();
    const client = { generateInsight: vi.fn() };

    const mutation = useGenerateAIInsight(client as never, { invalidateQueries }) as unknown as {
      onSuccess: () => Promise<void>;
    };

    await mutation.onSuccess();

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["ai-insights", "history"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "overview"] });
  });
});
