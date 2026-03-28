import type { Meta, StoryObj } from "@storybook/vue3";
import SimulationCard from "./SimulationCard.vue";
import type { SimulationCardDto } from "../../contracts/simulation-card.dto";

const meta: Meta<typeof SimulationCard> = {
  title: "Features/Simulations/SimulationCard",
  component: SimulationCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Card displaying a saved financial simulation with type tag, summary, main result value, and delete action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SimulationCard>;

export const InstallmentVsCash: Story = {
  name: "Installment vs Cash",
  args: {
    simulation: {
      id: "sim-001",
      name: "Comprar TV à vista vs parcelado",
      type: "installment_vs_cash",
      created_at: "2026-03-10T10:00:00Z",
      summary: "À vista economiza R$ 480,00 em juros em 12x",
      result_value: 480,
    } satisfies SimulationCardDto,
  },
};

export const GoalProjection: Story = {
  name: "Goal Projection",
  args: {
    simulation: {
      id: "sim-003",
      name: "Meta: Viagem para Europa em 18 meses",
      type: "goal_projection",
      created_at: "2026-02-20T09:00:00Z",
      summary: "Poupar R$ 1.389,00/mês para atingir R$ 25.000",
      result_value: 1389,
    } satisfies SimulationCardDto,
  },
};

export const InvestmentReturn: Story = {
  name: "Investment Return",
  args: {
    simulation: {
      id: "sim-005",
      name: "CDB 14% ao ano por 24 meses",
      type: "investment_return",
      created_at: "2026-03-01T08:00:00Z",
      summary: "R$ 10.000 renderiam R$ 12.996,00 em 24 meses",
      result_value: 12996,
    } satisfies SimulationCardDto,
  },
};

export const Loading: Story = {
  args: {
    simulation: {
      id: "sim-loading",
      name: "Carregando...",
      type: "investment_return",
      created_at: "2026-03-01T08:00:00Z",
      summary: "",
      result_value: null,
    } satisfies SimulationCardDto,
    loading: true,
  },
};

export const NoResult: Story = {
  name: "No Result Value",
  args: {
    simulation: {
      id: "sim-novalue",
      name: "Simulação sem valor principal",
      type: "goal_projection",
      created_at: "2026-03-05T12:00:00Z",
      summary: "Resultado qualitativo sem valor monetário direto",
      result_value: null,
    } satisfies SimulationCardDto,
  },
};
