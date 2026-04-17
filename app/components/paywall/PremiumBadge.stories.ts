import type { Meta, StoryObj } from "@storybook/vue3";
import PremiumBadge from "./PremiumBadge.vue";

const meta: Meta<typeof PremiumBadge> = {
  title: "Paywall/PremiumBadge",
  component: PremiumBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Small inline badge indicating premium-only content. Shows a crown icon with 'Premium' label.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PremiumBadge>;

export const Default: Story = {};
