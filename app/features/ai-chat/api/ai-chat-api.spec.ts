import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AiChatApiClient } from "./ai-chat-api";

describe("AiChatApiClient", () => {
  it("posts the question and unwraps the v2 envelope data", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        success: true,
        message: "Resposta gerada com sucesso",
        data: {
          answer: "Até agora você gastou R$320,00 com alimentação.",
          model: "gpt-4o-mini",
          tokens_used: 380,
          cost_usd: 0.000057,
        },
      },
    });
    const client = new AiChatApiClient({ post } as unknown as AxiosInstance);

    const result = await client.askFinancialQuestion("Quanto gastei com alimentação?");

    expect(post).toHaveBeenCalledWith("/ai/chat", {
      question: "Quanto gastei com alimentação?",
    });
    expect(result).toEqual({
      answer: "Até agora você gastou R$320,00 com alimentação.",
      model: "gpt-4o-mini",
      tokens_used: 380,
      cost_usd: 0.000057,
    });
  });

  it("tolerates a legacy flat payload without the envelope wrapper", async () => {
    const flat = { answer: "Sem dados no período.", model: "gpt-4o-mini", tokens_used: 10, cost_usd: 0 };
    const post = vi.fn().mockResolvedValue({ data: flat });
    const client = new AiChatApiClient({ post } as unknown as AxiosInstance);

    const result = await client.askFinancialQuestion("E agora?");

    expect(result).toEqual(flat);
  });
});
