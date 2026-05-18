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
      summary: "Resumo diário",
      items: [
        {
          type: "saude_financeira",
          dimension: "general",
          title: "Saldo positivo",
          message: "Seu saldo fechou no azul.",
        },
      ],
      period_type: "daily",
      period_label: "2026-05-18",
      period_start: "2026-05-18",
      period_end: "2026-05-18",
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

    const result = await composable.generate({ periodType: "daily", anchorDate: "2026-05-18" });

    expect(mutateAsync).toHaveBeenCalledWith({ periodType: "daily", anchorDate: "2026-05-18" });
    expect(result?.items[0]?.title).toBe("Saldo positivo");
    expect(composable.currentInsight.value?.[0]?.message).toContain("saldo");
    expect(composable.callsRemaining.value).toBe(1);
    expect(composable.insightModel.value).toBe("gpt-4o-mini");
    expect(composable.insightPeriodLabel.value).toBe("2026-05-18");
  });

  it("delegates AI consent grant to the consent mutation", async () => {
    const grantConsent = vi.fn().mockResolvedValue(undefined);
    const composable = useAIInsights({
      entitlement: { data: ref(true), isLoading: ref(false) },
      mutation: { mutateAsync: vi.fn(), isPending: ref(false), error: ref(null) },
      consentMutation: { mutateAsync: grantConsent, isPending: ref(false) },
    } as never);

    await composable.grantAIConsent();

    expect(grantConsent).toHaveBeenCalledOnce();
  });

  it("delegates AI consent status checks to the injected status dependency", async () => {
    const hasAIConsent = vi.fn().mockResolvedValue(true);
    const composable = useAIInsights({
      entitlement: { data: ref(true), isLoading: ref(false) },
      mutation: { mutateAsync: vi.fn(), isPending: ref(false), error: ref(null) },
      consentStatus: { hasAIConsent },
    } as never);

    await expect(composable.hasAIConsent()).resolves.toBe(true);

    expect(hasAIConsent).toHaveBeenCalledOnce();
  });
});
