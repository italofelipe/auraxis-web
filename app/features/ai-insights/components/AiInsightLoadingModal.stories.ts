import type { Meta, StoryObj } from "@storybook/vue3";

import AiInsightLoadingModal from "./AiInsightLoadingModal.vue";

const meta: Meta<typeof AiInsightLoadingModal> = {
  title: "AI Insights/AiInsightLoadingModal",
  component: AiInsightLoadingModal,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AiInsightLoadingModal>;

export const Open: Story = {
  args: {
    modelValue: true,
  },
};
