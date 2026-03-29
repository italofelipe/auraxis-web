import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestionnaireQuery } from "./use-questionnaire-query";
import type { QuestionnaireDto } from "~/features/investor-profile/contracts/investor-profile.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

const MOCK_QUESTIONNAIRE: QuestionnaireDto = {
  questions: [
    {
      id: 1,
      text: "Pergunta 1?",
      options: [
        { id: 1, text: "Opção 1", points: 1 },
        { id: 2, text: "Opção 2", points: 2 },
      ],
    },
  ],
};

describe("useQuestionnaireQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical questionnaire query key", () => {
    const client = { getQuestionnaire: vi.fn().mockResolvedValue(MOCK_QUESTIONNAIRE) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useQuestionnaireQuery(client as never) as unknown as {
      queryKey: readonly ["investor-profile", "questionnaire"];
    };

    expect(query.queryKey).toEqual(["investor-profile", "questionnaire"]);
  });

  it("sets staleTime to Infinity", () => {
    const client = { getQuestionnaire: vi.fn().mockResolvedValue(MOCK_QUESTIONNAIRE) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useQuestionnaireQuery(client as never) as unknown as {
      staleTime: number;
    };

    expect(query.staleTime).toBe(Infinity);
  });

  it("calls client.getQuestionnaire and returns the questionnaire", async () => {
    const client = { getQuestionnaire: vi.fn().mockResolvedValue(MOCK_QUESTIONNAIRE) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<QuestionnaireDto> }) => opts,
    );

    const query = useQuestionnaireQuery(client as never) as unknown as {
      queryFn: () => Promise<QuestionnaireDto>;
    };

    const result = await query.queryFn();

    expect(client.getQuestionnaire).toHaveBeenCalledOnce();
    expect(result).toEqual(MOCK_QUESTIONNAIRE);
  });

  it("propagates error from client.getQuestionnaire", async () => {
    const client = {
      getQuestionnaire: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<QuestionnaireDto> }) => opts,
    );

    const query = useQuestionnaireQuery(client as never) as unknown as {
      queryFn: () => Promise<QuestionnaireDto>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
