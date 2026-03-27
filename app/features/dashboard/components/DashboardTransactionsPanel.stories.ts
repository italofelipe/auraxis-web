import type { Meta, StoryObj } from "@storybook/vue3";
import DashboardTransactionsPanel from "./DashboardTransactionsPanel.vue";
import type { DashboardTransactionsPanelProps } from "./DashboardTransactionsPanel.types";

const meta: Meta<typeof DashboardTransactionsPanel> = {
  title: "Features/Dashboard/DashboardTransactionsPanel",
  component: DashboardTransactionsPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Side panel for the dashboard displaying upcoming dues and expenses by category. Uses UiListPanel as the shell and UiSegmentedControl for quick tab switching between the two views.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DashboardTransactionsPanel>;

const defaultProps: DashboardTransactionsPanelProps = {
  isLoading: false,
  upcomingDues: [
    { id: "1", description: "Aluguel", amount: 1800, dueDate: "2026-04-05", category: "Moradia" },
    { id: "2", description: "Plano de saúde", amount: 420, dueDate: "2026-04-08", category: "Saúde" },
    { id: "3", description: "Internet", amount: 130, dueDate: "2026-04-10", category: null },
    { id: "4", description: "Energia", amount: 280, dueDate: "2026-04-15", category: "Serviços" },
  ],
  expensesByCategory: [
    { category: "Moradia", amount: 1800, percentage: 43.2 },
    { category: "Alimentação", amount: 920, percentage: 22.1 },
    { category: "Transporte", amount: 480, percentage: 11.5 },
    { category: "Saúde", amount: 420, percentage: 10.1 },
    { category: "Lazer", amount: 340, percentage: 8.2 },
    { category: "Outros", amount: 207, percentage: 4.9 },
  ],
};

export const Default: Story = {
  args: defaultProps,
};

export const Loading: Story = {
  args: { ...defaultProps, isLoading: true },
};

export const EmptyDues: Story = {
  name: "Empty — no upcoming dues",
  args: {
    ...defaultProps,
    upcomingDues: [],
  },
};

export const EmptyCategories: Story = {
  name: "Empty — no expense categories",
  args: {
    ...defaultProps,
    expensesByCategory: [],
  },
};

export const FullyEmpty: Story = {
  name: "Fully empty (no data)",
  args: {
    isLoading: false,
    upcomingDues: [],
    expensesByCategory: [],
  },
};
