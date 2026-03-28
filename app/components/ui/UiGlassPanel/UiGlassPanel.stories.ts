import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiGlassPanelProps } from "./UiGlassPanel.types";
import UiGlassPanel from "./UiGlassPanel.vue";

const meta: Meta<typeof UiGlassPanel> = {
  title: "Design System/UiGlassPanel",
  component: UiGlassPanel,
  tags: ["autodocs"],
  argTypes: {
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    radius: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    glow: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiGlassPanel>;

export const Default: Story = {
  args: {
    padding: "md",
    radius: "lg",
    glow: false,
  },
  render: (args) => ({
    components: { UiGlassPanel },
    setup(): { args: UiGlassPanelProps } { return { args }; },
    template: "<UiGlassPanel v-bind=\"args\">Glass panel content</UiGlassPanel>",
  }),
};

export const WithGlow: Story = {
  args: {
    padding: "md",
    radius: "lg",
    glow: true,
  },
  render: (args) => ({
    components: { UiGlassPanel },
    setup(): { args: UiGlassPanelProps } { return { args }; },
    template: "<UiGlassPanel v-bind=\"args\">Glass panel with brand glow</UiGlassPanel>",
  }),
};

export const SmallRadius: Story = {
  args: {
    padding: "sm",
    radius: "sm",
    glow: false,
  },
  render: (args) => ({
    components: { UiGlassPanel },
    setup(): { args: UiGlassPanelProps } { return { args }; },
    template: "<UiGlassPanel v-bind=\"args\">Small radius glass panel</UiGlassPanel>",
  }),
};

export const NoPadding: Story = {
  args: {
    padding: "none",
    radius: "lg",
    glow: false,
  },
  render: (args) => ({
    components: { UiGlassPanel },
    setup(): { args: UiGlassPanelProps } { return { args }; },
    template: "<UiGlassPanel v-bind=\"args\"><div style=\"padding: 16px;\">Custom padded content</div></UiGlassPanel>",
  }),
};
