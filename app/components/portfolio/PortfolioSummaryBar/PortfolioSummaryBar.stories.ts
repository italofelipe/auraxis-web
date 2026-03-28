import type { Meta, StoryObj } from "@storybook/vue3";
import PortfolioSummaryBar from "./PortfolioSummaryBar.vue";
import type { PortfolioSummaryDto } from "~/features/portfolio/contracts/portfolio.dto";

const meta: Meta<typeof PortfolioSummaryBar> = {
  title: "Features/Portfolio/PortfolioSummaryBar",
  component: PortfolioSummaryBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontal bar displaying 4 portfolio KPIs: total value, total cost, total return percent, and daily change percent. Supports loading skeleton and null data states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PortfolioSummaryBar>;

const defaultSummary: PortfolioSummaryDto = {
  total_value: 100290,
  total_cost: 86600,
  day_change_percent: 0.84,
  total_return_percent: 15.81,
  asset_count: 7,
};

export const Default: Story = {
  args: {
    summary: defaultSummary,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    summary: null,
    loading: true,
  },
};

export const AllPositive: Story = {
  name: "All positive returns",
  args: {
    summary: {
      total_value: 120000,
      total_cost: 95000,
      day_change_percent: 2.15,
      total_return_percent: 26.32,
      asset_count: 9,
    },
    loading: false,
  },
};

export const AllNegative: Story = {
  name: "All negative returns",
  args: {
    summary: {
      total_value: 78000,
      total_cost: 90000,
      day_change_percent: -1.42,
      total_return_percent: -13.33,
      asset_count: 5,
    },
    loading: false,
  },
};

export const NoReturn: Story = {
  name: "No return data (null percents)",
  args: {
    summary: {
      total_value: 50000,
      total_cost: 50000,
      day_change_percent: null,
      total_return_percent: null,
      asset_count: 3,
    },
    loading: false,
  },
};
