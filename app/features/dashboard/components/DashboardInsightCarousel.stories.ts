import type { Meta, StoryObj } from "@storybook/vue3";
import DashboardInsightCarousel from "./DashboardInsightCarousel.vue";

const meta: Meta<typeof DashboardInsightCarousel> = {
  title: "Dashboard/DashboardInsightCarousel",
  component: DashboardInsightCarousel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Stories-style carousel with the four dashboard highlight panels. The 3px progress bar at the top is clipped by the card's own border radius — a bar that thin cannot round itself, since the CSS clamping algorithm scales a 20px radius down by 3/20.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardInsightCarousel>;

const goals = [
  { id: "g1", name: "Pc Mini itx", current: 0, target: 13_000, percent: 0 },
  { id: "g2", name: "Montar PC novo", current: 1_400, target: 35_000, percent: 4 },
  { id: "g3", name: "Novo PC", current: 0, target: 35_000, percent: 0 },
  { id: "g4", name: "comprar um civic", current: 0, target: 240_000, percent: 0 },
];

const upcomingDues = [
  {
    id: "d1",
    title: "Fatura do cartão",
    amount: 1_840,
    dueDate: "2026-08-10",
    daysLeft: 9,
    overdue: false,
  },
  {
    id: "d2",
    title: "Aluguel",
    amount: 2_400,
    dueDate: "2026-08-05",
    daysLeft: 4,
    overdue: false,
  },
];

const topExpenses = [
  { category: "Moradia", amount: 2_400, percentage: 39 },
  { category: "Mercado", amount: 980, percentage: 16 },
  { category: "Transporte", amount: 420, percentage: 7 },
];

export const Default: Story = {
  args: {
    upcomingDues,
    goals,
    topExpenses,
    health: { score: 78, tier: "good" },
  },
};

/** The panel the PO reported on — the progress bar sits right above it. */
export const GoalsPanel: Story = {
  args: {
    upcomingDues: [],
    goals,
    topExpenses: [],
    health: null,
  },
};
