import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AiInsightSection from "./AiInsightSection.vue";

const stubs = {
  NAlert: { template: "<div class='n-alert'><slot /></div>" },
  NTag: { template: "<span class='n-tag'><slot /></span>" },
};

describe("AiInsightSection", () => {
  it("renders parsed insight cards and model metadata", () => {
    const wrapper = mount(AiInsightSection, {
      props: {
        insight: [
          {
            type: "alerta_orcamento",
            dimension: "budgets",
            title: "Orçamento pressionado",
            message: "Moradia chegou a 48% da renda.",
          },
        ],
        periodLabel: "2026-05",
        isStale: false,
        model: "gpt-4o-mini",
        tokensUsed: 320,
        costUsd: 0.000048,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Insights de IA");
    expect(wrapper.text()).toContain("maio de 2026");
    expect(wrapper.text()).toContain("gpt-4o-mini");
    expect(wrapper.text()).toContain("320 tokens");
    expect(wrapper.text()).toContain("Orçamento pressionado");
  });

  it("shows stale warning when data comes from a previous month", () => {
    const wrapper = mount(AiInsightSection, {
      props: {
        insight: [],
        periodLabel: "2026-04",
        isStale: true,
        model: "gpt-4o-mini",
        tokensUsed: 0,
        costUsd: 0,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("podem estar desatualizados");
  });

  it("renders only requested dimension items", () => {
    const wrapper = mount(AiInsightSection, {
      props: {
        insight: [
          {
            type: "saude_financeira",
            dimension: "general",
            title: "Visão geral",
            message: "Resumo do período.",
          },
          {
            type: "gasto_elevado",
            dimension: "transactions",
            title: "Transações em atenção",
            message: "Há gastos incomuns.",
          },
          {
            type: "alerta_meta",
            dimension: "goals",
            title: "Meta em atenção",
            message: "O objetivo atrasou.",
          },
        ],
        dimension: "transactions",
        periodLabel: "2026-05-18",
        isStale: false,
        model: "gpt-4o-mini",
        tokensUsed: 80,
        costUsd: 0,
      },
      global: { stubs },
    });

    expect(wrapper.text()).not.toContain("Visão geral");
    expect(wrapper.text()).toContain("Transações em atenção");
    expect(wrapper.text()).not.toContain("Meta em atenção");
  });
});
