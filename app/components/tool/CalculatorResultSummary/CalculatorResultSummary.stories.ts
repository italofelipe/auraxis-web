import type { Meta, StoryObj } from "@storybook/vue3";
import CalculatorResultSummary from "./CalculatorResultSummary.vue";

const meta: Meta<typeof CalculatorResultSummary> = {
  title: "Features/Tools/CalculatorResultSummary",
  component: CalculatorResultSummary,
  tags: ["autodocs"],
  argTypes: {
    badge: {
      control: "select",
      options: ["success", "warning", "info", "default", undefined],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Generic result summary card — shows the main metric from any calculation with an optional recommendation badge, reason text, and a metrics grid.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CalculatorResultSummary>;

export const CashRecommendation: Story = {
  args: {
    label: "Recomendação",
    value: "À Vista",
    badge: "warning",
    reason: "O desconto à vista supera o custo de oportunidade. Pagar à vista é mais vantajoso.",
    metrics: [
      { label: "Preço à vista", value: "R$ 900,00" },
      { label: "Parcelado nominal", value: "R$ 990,00" },
      { label: "Parcelado em valor presente", value: "R$ 942,50", trend: 4.72 },
    ],
  },
};

export const InstallmentRecommendation: Story = {
  args: {
    label: "Recomendação",
    value: "Parcelado",
    badge: "success",
    reason: "O parcelamento em valor presente é mais barato do que pagar à vista.",
    metrics: [
      { label: "Preço à vista", value: "R$ 900,00" },
      { label: "Parcelado nominal", value: "R$ 990,00" },
      { label: "Parcelado em valor presente", value: "R$ 870,00", trend: -3.33 },
    ],
  },
};

export const Neutral: Story = {
  args: {
    label: "Resultado",
    value: "Neutro",
    badge: "default",
    reason: "A diferença está dentro da faixa de neutralidade. As opções são equivalentes.",
    metrics: [
      { label: "Preço à vista", value: "R$ 500,00" },
      { label: "Parcelado nominal", value: "R$ 510,00" },
      { label: "Parcelado em valor presente", value: "R$ 498,00", trend: -0.4 },
    ],
  },
};
