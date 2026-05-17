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
        type: "orcamento_ultrapassado",
        title: "Orçamento em atenção",
        message: "A categoria Mercado passou do limite planejado.",
      },
      {
        type: "savings_rate_gap",
        title: "Taxa de poupança abaixo do plano",
        message: "Você precisa poupar mais 8% da renda para atingir o objetivo.",
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
