import type { Meta, StoryObj } from "@storybook/vue3";
import type { Component } from "vue";
import type { UiMetricCardProps } from "./UiMetricCard.types";
import { Wallet } from "lucide-vue-next";
import UiMetricCard from "./UiMetricCard.vue";

const meta: Meta<typeof UiMetricCard> = {
  title: "Design System/UiMetricCard",
  component: UiMetricCard,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    trend: { control: "number" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiMetricCard>;

export const Default: Story = {
  args: {
    label: "Saldo Total",
    value: "R$ 12.430,00",
    trend: 5.25,
    loading: false,
  },
  render: (args) => ({
    components: { UiMetricCard },
    setup(): { args: UiMetricCardProps } { return { args }; },
    template: "<UiMetricCard v-bind=\"args\" />",
  }),
};

export const NegativeTrend: Story = {
  args: {
    label: "Despesas",
    value: "R$ 3.200,00",
    trend: -2.8,
    loading: false,
  },
  render: (args) => ({
    components: { UiMetricCard },
    setup(): { args: UiMetricCardProps } { return { args }; },
    template: "<UiMetricCard v-bind=\"args\" />",
  }),
};

export const WithIcon: Story = {
  args: {
    label: "Carteira",
    value: "R$ 8.750,00",
    trend: 1.5,
    loading: false,
  },
  render: (args) => ({
    components: { UiMetricCard },
    setup(): { args: UiMetricCardProps; Wallet: Component } { return { args, Wallet }; },
    template: "<UiMetricCard v-bind=\"args\" :icon=\"Wallet\" />",
  }),
};

export const NoTrend: Story = {
  args: {
    label: "Entradas",
    value: "R$ 5.000,00",
    loading: false,
  },
  render: (args) => ({
    components: { UiMetricCard },
    setup(): { args: UiMetricCardProps } { return { args }; },
    template: "<UiMetricCard v-bind=\"args\" />",
  }),
};

export const Loading: Story = {
  args: {
    label: "Saldo Total",
    value: "",
    loading: true,
  },
  render: (args) => ({
    components: { UiMetricCard },
    setup(): { args: UiMetricCardProps } { return { args }; },
    template: "<UiMetricCard v-bind=\"args\" />",
  }),
};
