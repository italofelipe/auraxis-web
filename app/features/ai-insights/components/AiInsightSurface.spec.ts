import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiInsightSurface from "./AiInsightSurface.vue";

const useAIInsightsMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/ai-insights/composables/useAIInsights", () => ({
  useAIInsights: useAIInsightsMock,
}));

const stubs = {
  AiInsightButton: { template: "<button>Gerar insight com IA</button>" },
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
});
