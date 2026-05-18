import type { Meta, StoryObj } from "@storybook/vue3";
import { NCollapse } from "naive-ui";

import AiInsightAccordionItem from "./AiInsightAccordionItem.vue";

const meta: Meta<typeof AiInsightAccordionItem> = {
  title: "AI Insights/AiInsightAccordionItem",
  component: AiInsightAccordionItem,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  render: (args) => ({
    components: { AiInsightAccordionItem, NCollapse },
    setup: () => ({ args }),
    template: "<NCollapse><AiInsightAccordionItem v-bind='args' /></NCollapse>",
  }),
};

export default meta;
type Story = StoryObj<typeof AiInsightAccordionItem>;

export const Monthly: Story = {
  args: {
    item: {
      id: "insight-1",
      summary: "Resumo mensal com saldo positivo e pontos de atenção.",
      insightType: "monthly",
      periodType: "monthly",
      periodLabel: "2026-05",
      periodStart: "2026-05-01",
      periodEnd: "2026-05-31",
      model: "gpt-4o-mini",
      tokensUsed: 320,
      costUsd: 0.000048,
      createdAt: "2026-05-12T08:15:00Z",
      items: [
        {
          type: "saude_financeira",
          dimension: "general",
          title: "Saldo positivo",
          message: "Seu saldo do mês segue positivo, mesmo com aumento de gastos variáveis.",
        },
      ],
    },
  },
};
