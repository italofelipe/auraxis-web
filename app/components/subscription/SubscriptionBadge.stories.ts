import type { Meta, StoryObj } from "@storybook/vue3";
import SubscriptionBadge from "./SubscriptionBadge.vue";

const meta: Meta<typeof SubscriptionBadge> = {
  title: "Features/Subscription/SubscriptionBadge",
  component: SubscriptionBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Inline badge showing the user's current subscription plan.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubscriptionBadge>;

export const Default: Story = {};
