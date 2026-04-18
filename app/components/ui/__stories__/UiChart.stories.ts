import type { Meta, StoryObj } from "@storybook/vue3";
import UiChart from "../UiChart.vue";
import { colors } from "~/theme/tokens/colors";

const meta: Meta<typeof UiChart> = {
  title: "Shared/UiChart",
  component: UiChart,
  tags: ["autodocs"],
  argTypes: {
    height: { control: "text" },
    width: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiChart>;

export const LineChart: Story = {
  args: {
    height: "300px",
    option: {
      xAxis: { type: "category", data: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"] },
      yAxis: { type: "value" },
      series: [{
        type: "line",
        data: [5200, 6100, 5800, 7400, 8200, 9100],
        areaStyle: { color: "rgba(68, 212, 255, 0.1)" },
        lineStyle: { color: colors.cyan[500] },
        itemStyle: { color: colors.cyan[500] },
      }],
    },
  },
};

export const DonutChart: Story = {
  args: {
    height: "300px",
    option: {
      series: [{
        type: "pie",
        radius: ["50%", "80%"],
        data: [
          { value: 40, name: "Renda Fixa" },
          { value: 30, name: "Ações" },
          { value: 20, name: "FIIs" },
          { value: 10, name: "Crypto" },
        ],
      }],
    },
  },
};

export const BarComparison: Story = {
  args: {
    height: "300px",
    option: {
      xAxis: { type: "category", data: ["Jan", "Fev", "Mar", "Abr"] },
      yAxis: { type: "value" },
      series: [
        { type: "bar", name: "Receita", data: [8000, 8500, 7800, 9200], itemStyle: { color: colors.positive.DEFAULT } },
        { type: "bar", name: "Despesas", data: [5000, 5200, 4900, 5800], itemStyle: { color: colors.negative.DEFAULT } },
      ],
    },
  },
};
