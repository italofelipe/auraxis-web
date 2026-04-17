import type { Meta, StoryObj } from "@storybook/vue3";
import UpgradeCTA from "./UpgradeCTA.vue";

const meta: Meta<typeof UpgradeCTA> = {
  title: "Paywall/UpgradeCTA",
  component: UpgradeCTA,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Call-to-action block shown to free users when they encounter a premium feature. Navigates to /plans.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpgradeCTA>;

export const Default: Story = {};
