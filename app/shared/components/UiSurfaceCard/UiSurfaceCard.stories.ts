import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiSurfaceCardProps } from "./UiSurfaceCard.types";
import UiSurfaceCard from "./UiSurfaceCard.vue";

const meta: Meta<typeof UiSurfaceCard> = {
  title: "Design System/UiSurfaceCard",
  component: UiSurfaceCard,
  tags: ["autodocs"],
  argTypes: {
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    as: {
      control: "select",
      options: ["div", "article", "section"],
    },
    shadow: { control: "boolean" },
    bordered: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiSurfaceCard>;

export const Default: Story = {
  args: {
    padding: "md",
    shadow: true,
    bordered: true,
    as: "div",
  },
  render: (args) => ({
    components: { UiSurfaceCard },
    setup(): { args: UiSurfaceCardProps } { return { args }; },
    template: "<UiSurfaceCard v-bind=\"args\">Card content here</UiSurfaceCard>",
  }),
};

export const NoPadding: Story = {
  args: {
    padding: "none",
    shadow: true,
    bordered: true,
  },
  render: (args) => ({
    components: { UiSurfaceCard },
    setup(): { args: UiSurfaceCardProps } { return { args }; },
    template: "<UiSurfaceCard v-bind=\"args\">No padding card</UiSurfaceCard>",
  }),
};

export const NoBorder: Story = {
  args: {
    padding: "md",
    shadow: true,
    bordered: false,
  },
  render: (args) => ({
    components: { UiSurfaceCard },
    setup(): { args: UiSurfaceCardProps } { return { args }; },
    template: "<UiSurfaceCard v-bind=\"args\">Card without border</UiSurfaceCard>",
  }),
};

export const AsSurfaceArticle: Story = {
  args: {
    padding: "md",
    shadow: true,
    bordered: true,
    as: "article",
  },
  render: (args) => ({
    components: { UiSurfaceCard },
    setup(): { args: UiSurfaceCardProps } { return { args }; },
    template: "<UiSurfaceCard v-bind=\"args\"><p>Card rendered as article element</p></UiSurfaceCard>",
  }),
};
