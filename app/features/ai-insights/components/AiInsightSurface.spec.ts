import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiInsightSurface from "./AiInsightSurface.vue";

const useAIInsightsMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/ai-insights/composables/useAIInsights", () => ({
  useAIInsights: useAIInsightsMock,
}));

const stubs = {
  AiInsightButton: {
    props: ["sourceSurface"],
    template: "<button data-testid='ai-button'>{{ sourceSurface }}</button>",
  },
  AiInsightSection: {
    props: ["insight"],
    template: "<section data-testid='insight-section'>{{ insight.map((item) => item.title).join(', ') }}</section>",
  },
};

describe("AiInsightSurface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty contextual state when the generated insight has no item for the surface", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "saude_financeira",
          dimension: "general",
          title: "Visão geral",
          message: "Resumo do período.",
        },
      ]),
      insightPeriodLabel: ref("2026-05"),
      isStale: ref(false),
      insightModel: ref("gpt-4o-mini"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "transactions" },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='insight-section']").exists()).toBe(false);
    expect(wrapper.text()).toContain("Nenhum insight específico para esta área");
    expect(wrapper.text()).toContain("A visão completa continua disponível em Insights");
  });

  it("shows wallet-only insights and passes the wallet source surface", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "saude_financeira",
          dimension: "wallet",
          title: "Carteira diversificada",
          message: "Sua carteira tem classes diferentes.",
        },
        {
          type: "padrao_gasto",
          dimension: "transactions",
          title: "Transações fora do padrão",
          message: "Algumas despesas cresceram.",
        },
      ]),
      insightPeriodLabel: ref("2026-05"),
      isStale: ref(false),
      insightModel: ref("gpt-4o-mini"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "wallet" as never },
      global: { stubs },
    });

    expect(wrapper.get("[data-testid='ai-button']").text()).toContain("wallet");
    expect(wrapper.get("[data-testid='insight-section']").text()).toContain(
      "Carteira diversificada",
    );
    expect(wrapper.get("[data-testid='insight-section']").text()).not.toContain(
      "Transações fora do padrão",
    );
  });
});
