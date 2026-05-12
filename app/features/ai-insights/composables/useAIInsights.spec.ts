import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";

import { useAIInsights } from "./useAIInsights";

describe("useAIInsights", () => {
  it("does not call the backend when the user has no premium entitlement", async () => {
    const mutateAsync = vi.fn();

    const composable = useAIInsights({
      entitlement: { data: ref(false), isLoading: ref(false) },
      mutation: { mutateAsync, isPending: ref(false), error: ref(null) },
    } as never);

    const result = await composable.generate();

    expect(result).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(composable.hasPremium.value).toBe(false);
  });

  it("parses generated insights and stores metadata for rendering", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      insights: JSON.stringify([
        { type: "saude_financeira", title: "Saldo positivo", message: "Seu saldo fechou no azul." },
      ]),
      month: "2026-05",
      model: "gpt-4o-mini",
      tokens_used: 180,
      cost_usd: 0.00003,
      cached: false,
      callsRemaining: 1,
    });

    const composable = useAIInsights({
      entitlement: { data: ref(true), isLoading: ref(false) },
      mutation: { mutateAsync, isPending: ref(false), error: ref(null) },
    } as never);

    const result = await composable.generate({ month: "2026-05" });

    expect(mutateAsync).toHaveBeenCalledWith({ month: "2026-05" });
    expect(result?.items[0]?.title).toBe("Saldo positivo");
    expect(composable.currentInsight.value?.[0]?.message).toContain("saldo");
    expect(composable.callsRemaining.value).toBe(1);
    expect(composable.insightModel.value).toBe("gpt-4o-mini");
  });
});
