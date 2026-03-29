import type { Meta, StoryObj } from "@storybook/vue3";
import UiStickySummaryCard from "./UiStickySummaryCard.vue";

interface StickySummaryArgs {
  glow: boolean
  sticky: boolean
  topOffset: string
}

const meta: Meta<typeof UiStickySummaryCard> = {
  title: "Design System/UiStickySummaryCard",
  component: UiStickySummaryCard,
  tags: ["autodocs"],
  argTypes: {
    glow: { control: "boolean" },
    sticky: { control: "boolean" },
    topOffset: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A layout card designed to be sticky in a two-column calculator layout. Wraps content in a glass panel that sticks to the viewport top while the page scrolls.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UiStickySummaryCard>;

export const Default: Story = {
  args: {
    glow: true,
    sticky: true,
    topOffset: "var(--space-3)",
  },
  render: (args) => ({
    components: { UiStickySummaryCard },
    setup(): { args: StickySummaryArgs } { return { args: args as StickySummaryArgs }; },
    template: `<UiStickySummaryCard v-bind="args">
      <p style="margin:0">Calculator summary content goes here.</p>
    </UiStickySummaryCard>`,
  }),
};

export const NoSticky: Story = {
  args: {
    glow: true,
    sticky: false,
    topOffset: "var(--space-3)",
  },
  render: (args) => ({
    components: { UiStickySummaryCard },
    setup(): { args: StickySummaryArgs } { return { args: args as StickySummaryArgs }; },
    template: `<UiStickySummaryCard v-bind="args">
      <p style="margin:0">Non-sticky variant — does not follow scroll.</p>
    </UiStickySummaryCard>`,
  }),
};

export const NoGlow: Story = {
  args: {
    glow: false,
    sticky: true,
    topOffset: "var(--space-3)",
  },
  render: (args) => ({
    components: { UiStickySummaryCard },
    setup(): { args: StickySummaryArgs } { return { args: args as StickySummaryArgs }; },
    template: `<UiStickySummaryCard v-bind="args">
      <p style="margin:0">Sticky card without brand glow decoration.</p>
    </UiStickySummaryCard>`,
  }),
};
