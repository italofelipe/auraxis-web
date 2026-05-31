import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSubmitInsightFeedback,
  type SubmitInsightFeedbackVariables,
} from "./use-submit-insight-feedback";

const useMutationMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
}));

describe("useSubmitInsightFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("registers a mutation that posts feedback for the given insight id", async () => {
    const client = {
      submitInsightFeedback: vi.fn().mockResolvedValue({ id: "fb-1", insight_id: "ins-1" }),
    };

    const mutation = useSubmitInsightFeedback(client as never) as unknown as {
      mutationFn: (variables: SubmitInsightFeedbackVariables) => Promise<unknown>;
    };

    await mutation.mutationFn({
      insightId: "ins-1",
      feedback: { relevance: 5, truthfulness: 4, depth: 3, usefulness: 5, comment: "ok" },
    });

    expect(client.submitInsightFeedback).toHaveBeenCalledWith("ins-1", {
      relevance: 5,
      truthfulness: 4,
      depth: 3,
      usefulness: 5,
      comment: "ok",
    });
  });
});
