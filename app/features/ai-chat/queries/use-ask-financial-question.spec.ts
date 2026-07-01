import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAskFinancialQuestion } from "./use-ask-financial-question";

const useMutationMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
}));

describe("useAskFinancialQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("registers a non-retrying mutation that calls the chat client", async () => {
    const client = {
      askFinancialQuestion: vi.fn().mockResolvedValue({
        answer: "R$320,00",
        model: "gpt-4o-mini",
        tokens_used: 380,
        cost_usd: 0.000057,
      }),
    };

    const mutation = useAskFinancialQuestion(client as never) as unknown as {
      mutationFn: (question: string) => Promise<unknown>;
      retry: boolean;
    };

    await mutation.mutationFn("Quanto gastei?");

    expect(client.askFinancialQuestion).toHaveBeenCalledWith("Quanto gastei?");
    expect(mutation.retry).toBe(false);
  });
});
