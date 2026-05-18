import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AiInsightAccordionItem from "./AiInsightAccordionItem.vue";
import type { AIInsight } from "~/features/ai-insights/model/ai-insight";

const stubs = {
  NCollapseItem: { template: "<section><slot name='header' /><slot /></section>" },
  CollapseItem: { template: "<section><slot name='header' /><slot /></section>" },
  NTag: { template: "<span><slot /></span>" },
};

const insight: AIInsight = {
  id: "ai-1",
  summary: "Resumo do período.",
  items: [
    {
      type: "saude_financeira",
      dimension: "general",
      title: "Saldo do período",
      message: "Você fechou no azul.",
    },
    {
      type: "gasto_elevado",
      dimension: "transactions",
      title: "Gastos incomuns",
      message: "Lazer subiu no período.",
    },
  ],
  insightType: "daily",
  periodType: "daily",
  periodLabel: "2026-05-18",
  periodStart: "2026-05-18",
  periodEnd: "2026-05-18",
  model: "gpt-4o-mini",
  tokensUsed: 320,
  costUsd: 0.000048,
  createdAt: "2026-05-18T09:00:00Z",
};

describe("AiInsightAccordionItem", () => {
  it("groups historical insight items by dimension", () => {
    const wrapper = mount(AiInsightAccordionItem, {
      props: { item: insight },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Visão geral");
    expect(wrapper.text()).toContain("Transações");
    expect(wrapper.text()).toContain("Saldo do período");
    expect(wrapper.text()).toContain("Gastos incomuns");
  });
});
