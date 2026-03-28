import type { Meta, StoryObj } from "@storybook/vue3";
import DashboardSummaryGrid from "./DashboardSummaryGrid.vue";
import type { DashboardSummaryGridProps } from "./DashboardSummaryGrid.types";

const meta: Meta<typeof DashboardSummaryGrid> = {
  title: "Features/Dashboard/DashboardSummaryGrid",
  component: DashboardSummaryGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Grid of five KPI cards summarising the selected dashboard period: balance, income, expenses, upcoming dues and net worth. Each card delegates rendering to `UiMetricCard` and trend display to `UiTrendBadge`.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DashboardSummaryGrid>;

const defaultProps: DashboardSummaryGridProps = {
  summary: {
    income: 5400,
    expense: 3100,
    balance: 2300,
    upcomingDueTotal: 850,
    netWorth: 42000,
  },
  comparison: {
    incomeVsPreviousMonthPercent: 8.4,
    expenseVsPreviousMonthPercent: -2.1,
    balanceVsPreviousMonthPercent: 14.7,
  },
  portfolio: {
    currentValue: 42000,
    changePercent: 3.6,
  },
  upcomingDues: [
    { id: "1", description: "Aluguel", amount: 850, dueDate: "2026-04-05", category: "Moradia" },
  ],
  isLoading: false,
};

export const Default: Story = {
  args: defaultProps,
};

export const Loading: Story = {
  args: {
    ...defaultProps,
    isLoading: true,
  },
};

export const NegativePeriod: Story = {
  name: "Negative period (expenses up, income down)",
  args: {
    ...defaultProps,
    comparison: {
      incomeVsPreviousMonthPercent: -5.3,
      expenseVsPreviousMonthPercent: 12.8,
      balanceVsPreviousMonthPercent: -9.0,
    },
    portfolio: {
      currentValue: 38000,
      changePercent: -4.2,
    },
  },
};

export const NoComparison: Story = {
  name: "No comparison data (first month)",
  args: {
    ...defaultProps,
    comparison: {
      incomeVsPreviousMonthPercent: null,
      expenseVsPreviousMonthPercent: null,
      balanceVsPreviousMonthPercent: null,
    },
    portfolio: {
      currentValue: 42000,
      changePercent: null,
    },
  },
};

export const EmptySummary: Story = {
  name: "Empty summary (no transactions yet)",
  args: {
    summary: null,
    comparison: null,
    portfolio: null,
    upcomingDues: [],
    isLoading: false,
  },
};
