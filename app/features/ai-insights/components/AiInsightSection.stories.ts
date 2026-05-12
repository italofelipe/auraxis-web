import type { Meta, StoryObj } from "@storybook/vue3";

import AiInsightSection from "./AiInsightSection.vue";

const meta: Meta<typeof AiInsightSection> = {
  title: "AI Insights/AiInsightSection",
  component: AiInsightSection,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof AiInsightSection>;

export const Default: Story = {
  args: {
    month: "2026-05",
    isStale: false,
    model: "gpt-4o-mini",
    tokensUsed: 320,
    costUsd: 0.000048,
    insight: [
      {
        type: "gasto_elevado",
        title: "Alimentação acima do padrão",
        message: "Você gastou 28% acima da média em restaurantes neste mês.",
      },
      {
        type: "oportunidade_economia",
        title: "Assinaturas com potencial de corte",
        message: "Três assinaturas recorrentes somam R$ 147 e não tiveram uso recente.",
      },
    ],
  },
};

export const Stale: Story = {
  args: {
    ...Default.args,
    month: "2026-04",
    isStale: true,
  },
};
