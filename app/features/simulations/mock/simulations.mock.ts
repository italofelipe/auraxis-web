import type { SimulationCardDto } from "../contracts/simulation-card.dto";

/**
 * Mock simulations for development and Storybook usage.
 * Contains 6 simulations with varied types.
 */
export const MOCK_SIMULATIONS: SimulationCardDto[] = [
  {
    id: "sim-001",
    name: "Comprar TV à vista vs parcelado",
    type: "installment_vs_cash",
    created_at: "2026-03-10T10:00:00Z",
    summary: "À vista economiza R$ 480,00 em juros em 12x",
    result_value: 480,
  },
  {
    id: "sim-002",
    name: "Financiamento do notebook em 24x",
    type: "installment_vs_cash",
    created_at: "2026-03-15T14:30:00Z",
    summary: "Custo total parcelado: R$ 21.840,00 vs R$ 18.000,00 à vista",
    result_value: 3840,
  },
  {
    id: "sim-003",
    name: "Meta: Viagem para Europa em 18 meses",
    type: "goal_projection",
    created_at: "2026-02-20T09:00:00Z",
    summary: "Poupar R$ 1.389,00/mês para atingir R$ 25.000",
    result_value: 1389,
  },
  {
    id: "sim-004",
    name: "Meta: Entrada do apartamento em 3 anos",
    type: "goal_projection",
    created_at: "2026-01-05T11:00:00Z",
    summary: "Poupar R$ 2.500,00/mês para atingir R$ 90.000",
    result_value: 2500,
  },
  {
    id: "sim-005",
    name: "CDB 14% ao ano por 24 meses",
    type: "investment_return",
    created_at: "2026-03-01T08:00:00Z",
    summary: "R$ 10.000 renderiam R$ 12.996,00 em 24 meses",
    result_value: 12996,
  },
  {
    id: "sim-006",
    name: "Tesouro Selic — aporte mensal de R$ 500",
    type: "investment_return",
    created_at: "2026-02-10T16:00:00Z",
    summary: "Patrimônio estimado de R$ 38.450,00 em 5 anos",
    result_value: 38450,
  },
];
