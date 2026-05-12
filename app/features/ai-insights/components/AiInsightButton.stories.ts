import type { Meta, StoryObj } from "@storybook/vue3";

import AiInsightButton from "./AiInsightButton.vue";

const meta: Meta<typeof AiInsightButton> = {
  title: "AI Insights/AiInsightButton",
  component: AiInsightButton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof AiInsightButton>;

export const Default: Story = {};
