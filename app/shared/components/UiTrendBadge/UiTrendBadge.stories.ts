import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiTrendBadgeProps } from "./UiTrendBadge.types";
import UiTrendBadge from "./UiTrendBadge.vue";

const meta: Meta<typeof UiTrendBadge> = {
  title: "Design System/UiTrendBadge",
  component: UiTrendBadge,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "number" },
    showIcon: { control: "boolean" },
    decimals: { control: "number" },
  },
};

export default meta;

type Story = StoryObj<typeof UiTrendBadge>;

export const Positive: Story = {
  args: {
    value: 12.5,
    showIcon: true,
    decimals: 2,
  },
  render: (args) => ({
    components: { UiTrendBadge },
    setup(): { args: UiTrendBadgeProps } { return { args }; },
    template: "<UiTrendBadge v-bind=\"args\" />",
  }),
};

export const Negative: Story = {
  args: {
    value: -3.2,
    showIcon: true,
    decimals: 2,
  },
  render: (args) => ({
    components: { UiTrendBadge },
    setup(): { args: UiTrendBadgeProps } { return { args }; },
    template: "<UiTrendBadge v-bind=\"args\" />",
  }),
};

export const Neutral: Story = {
  args: {
    value: 0,
    showIcon: true,
    decimals: 2,
  },
  render: (args) => ({
    components: { UiTrendBadge },
    setup(): { args: UiTrendBadgeProps } { return { args }; },
    template: "<UiTrendBadge v-bind=\"args\" />",
  }),
};

export const NoIcon: Story = {
  args: {
    value: 5.75,
    showIcon: false,
    decimals: 2,
  },
  render: (args) => ({
    components: { UiTrendBadge },
    setup(): { args: UiTrendBadgeProps } { return { args }; },
    template: "<UiTrendBadge v-bind=\"args\" />",
  }),
};
