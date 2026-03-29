import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSubmitAnswersMutation } from "./use-submit-answers-mutation";
import type {
  QuestionnaireResultDto,
  SubmitAnswersPayload,
} from "~/features/investor-profile/contracts/investor-profile.dto";

const createApiMutationMock = vi.hoisted(() => vi.fn());

vi.mock("~/core/query/use-api-mutation", () => ({
  createApiMutation: createApiMutationMock,
}));

const MOCK_RESULT: QuestionnaireResultDto = {
  suggested_profile: "explorador",
  score: 9,
};

describe("useSubmitAnswersMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls createApiMutation with the submit answers function", async () => {
    const client = { submitAnswers: vi.fn().mockResolvedValue(MOCK_RESULT) };
    createApiMutationMock.mockImplementation(
      (fn: (payload: SubmitAnswersPayload) => Promise<QuestionnaireResultDto>) => ({
        mutationFn: fn,
      }),
    );

    useSubmitAnswersMutation(client as never);

    expect(createApiMutationMock).toHaveBeenCalledOnce();
  });

  it("passes the client.submitAnswers call through the mutation function", async () => {
    const client = { submitAnswers: vi.fn().mockResolvedValue(MOCK_RESULT) };

    createApiMutationMock.mockImplementation(
      (fn: (payload: SubmitAnswersPayload) => Promise<QuestionnaireResultDto>) => ({
        mutationFn: fn,
      }),
    );

    useSubmitAnswersMutation(client as never);

    const [mutationFn] = createApiMutationMock.mock.calls[0] as [
      (payload: SubmitAnswersPayload) => Promise<QuestionnaireResultDto>,
    ];

    const payload: SubmitAnswersPayload = { answers: [1, 2, 2, 3, 1] };
    const result = await mutationFn(payload);

    expect(client.submitAnswers).toHaveBeenCalledWith(payload);
    expect(result).toEqual(MOCK_RESULT);
  });

  it("includes the questionnaire query key in invalidates", () => {
    const client = { submitAnswers: vi.fn().mockResolvedValue(MOCK_RESULT) };
    createApiMutationMock.mockReturnValue({});

    useSubmitAnswersMutation(client as never);

    const [, options] = createApiMutationMock.mock.calls[0] as [
      unknown,
      { invalidates: string[][] },
    ];

    expect(options.invalidates).toContainEqual(["investor-profile", "questionnaire"]);
  });
});
