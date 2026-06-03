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
    props: ["insight", "forecast"],
    template: "<section data-testid='insight-section' :data-forecast='forecast'>{{ insight.map((item) => item.title).join(', ') }}</section>",
  },
  AiInsightFeedback: {
    props: ["insightId"],
    template: "<div data-testid='insight-feedback'>{{ insightId }}</div>",
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
      forecast: ref(false),
      currentInsightId: ref(null),
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
      forecast: ref(false),
      currentInsightId: ref(null),
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

  it("renders the feedback block and forwards forecast when an insight id exists", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "saude_financeira",
          dimension: "transactions",
          title: "Previsão de junho",
          message: "Suas contas recorrentes vencem cedo.",
        },
      ]),
      currentInsightId: ref("ins-42"),
      insightPeriodLabel: ref("2026-06"),
      isStale: ref(false),
      insightModel: ref("gpt-4o"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
      forecast: ref(true),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "transactions" },
      global: { stubs },
    });

    expect(wrapper.get("[data-testid='insight-feedback']").text()).toContain("ins-42");
    expect(wrapper.get("[data-testid='insight-section']").attributes("data-forecast")).toBe(
      "true",
    );
  });

  it("renders the inline result by default when a current insight is set", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "padrao_gasto",
          dimension: "transactions",
          title: "Gastos do período",
          message: "Suas despesas variáveis subiram.",
        },
      ]),
      currentInsightId: ref("ins-99"),
      insightPeriodLabel: ref("2026-06"),
      isStale: ref(false),
      insightModel: ref("gpt-4o"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
      forecast: ref(false),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "transactions" },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='ai-button']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='insight-section']").text()).toContain(
      "Gastos do período",
    );
  });

  it("suppresses the inline result when hideInlineResult is set but keeps the generate button", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "padrao_gasto",
          dimension: "transactions",
          title: "Gastos do período",
          message: "Suas despesas variáveis subiram.",
        },
      ]),
      currentInsightId: ref("ins-99"),
      insightPeriodLabel: ref("2026-06"),
      isStale: ref(false),
      insightModel: ref("gpt-4o"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
      forecast: ref(false),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "transactions", hideInlineResult: true },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='ai-button']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='insight-section']").exists()).toBe(false);
    // Feedback is intentionally NOT gated by hideInlineResult: Transactions
    // users still rate the insight they just generated even though the inline
    // result render is owned by the dedicated panel.
    const feedback = wrapper.find("[data-testid='insight-feedback']");
    expect(feedback.exists()).toBe(true);
    expect(feedback.text()).toContain("ins-99");
  });

  it("hides the feedback block when no insight id is available", () => {
    useAIInsightsMock.mockReturnValue({
      currentInsight: ref([
        {
          type: "saude_financeira",
          dimension: "transactions",
          title: "Visão geral",
          message: "Resumo do período.",
        },
      ]),
      currentInsightId: ref(null),
      insightPeriodLabel: ref("2026-05"),
      isStale: ref(false),
      insightModel: ref("gpt-4o"),
      tokensUsed: ref(120),
      costUsd: ref(0.00001),
      forecast: ref(false),
    });

    const wrapper = mount(AiInsightSurface, {
      props: { dimension: "transactions" },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='insight-feedback']").exists()).toBe(false);
  });
});
