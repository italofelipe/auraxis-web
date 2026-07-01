import { type ComputedRef, computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Subscription } from "~/features/subscription/model/subscription";

import { useAiChat, type UseAiChatOptions, type UseAiChatReturn } from "./use-ai-chat";

const featureFlagRef = ref(true);
const subscriptionRef = ref<Subscription | null>(null);

vi.mock("~/shared/feature-flags/use-feature-flag", () => ({
  useFeatureFlag: (): ComputedRef<boolean> => computed(() => featureFlagRef.value),
}));

vi.mock("~/features/subscription/queries/use-subscription-query", () => ({
  useSubscriptionQuery: (): { data: ComputedRef<Subscription | null> } => ({
    data: computed(() => subscriptionRef.value),
  }),
}));

vi.mock("~/features/ai-chat/queries/use-ask-financial-question", () => ({
  useAskFinancialQuestion: (): { mutateAsync: ReturnType<typeof vi.fn> } => ({
    mutateAsync: vi.fn(),
  }),
}));

const activeSubscription: Subscription = {
  id: "sub-1",
  planSlug: "premium",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: null,
  providerSubscriptionId: null,
};

/**
 * Builds the composable with deterministic clock/id injectors.
 *
 * @param overrides Option overrides (mutation, etc.).
 * @returns The composable return value.
 */
const buildChat = (overrides: Partial<UseAiChatOptions> = {}): UseAiChatReturn => {
  let seq = 0;
  /**
   * Deterministic monotonic id factory for stable assertions.
   *
   * @returns A sequential message id.
   */
  const createId = (): string => {
    seq += 1;
    return `id-${seq}`;
  };
  return useAiChat({
    now: (): Date => new Date("2026-06-30T12:00:00.000Z"),
    createId,
    ...overrides,
  });
};

describe("useAiChat", () => {
  beforeEach(() => {
    featureFlagRef.value = true;
    subscriptionRef.value = null;
  });

  it("reflects the feature flag via isEnabled", () => {
    const chat = buildChat({ mutation: { mutateAsync: vi.fn() } });
    expect(chat.isEnabled.value).toBe(true);
    featureFlagRef.value = false;
    expect(chat.isEnabled.value).toBe(false);
  });

  it("derives isPremium from the subscription status", () => {
    subscriptionRef.value = activeSubscription;
    const chat = buildChat({ mutation: { mutateAsync: vi.fn() } });
    expect(chat.isPremium.value).toBe(true);
  });

  it("toggles the drawer open/closed", () => {
    const chat = buildChat({ mutation: { mutateAsync: vi.fn() } });
    expect(chat.isOpen.value).toBe(false);
    chat.open();
    expect(chat.isOpen.value).toBe(true);
    chat.close();
    expect(chat.isOpen.value).toBe(false);
  });

  it("appends the user question and the assistant answer on success", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      answer: "Você gastou R$320,00.",
      model: "gpt-4o-mini",
      tokens_used: 380,
      cost_usd: 0.000057,
    });
    const chat = buildChat({ mutation: { mutateAsync } });

    await chat.ask("  Quanto gastei?  ");

    expect(mutateAsync).toHaveBeenCalledWith("Quanto gastei?");
    expect(chat.messages.value).toEqual([
      { id: "id-1", role: "user", content: "Quanto gastei?", createdAt: "2026-06-30T12:00:00.000Z" },
      {
        id: "id-2",
        role: "assistant",
        content: "Você gastou R$320,00.",
        createdAt: "2026-06-30T12:00:00.000Z",
      },
    ]);
    expect(chat.errorKind.value).toBeNull();
    expect(chat.isSending.value).toBe(false);
  });

  it("ignores blank questions", async () => {
    const mutateAsync = vi.fn();
    const chat = buildChat({ mutation: { mutateAsync } });

    await chat.ask("   ");

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(chat.messages.value).toHaveLength(0);
  });

  it("classifies a failed request into an error kind and keeps the question visible", async () => {
    const mutateAsync = vi.fn().mockRejectedValue({ status: 429, code: "AI_INSIGHT_BUDGET_EXCEEDED" });
    const chat = buildChat({ mutation: { mutateAsync } });

    await chat.ask("E agora?");

    expect(chat.errorKind.value).toBe("budget");
    expect(chat.messages.value).toHaveLength(1);
    expect(chat.messages.value[0]?.role).toBe("user");
    chat.dismissError();
    expect(chat.errorKind.value).toBeNull();
  });
});
