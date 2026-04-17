import type { Meta, StoryObj } from "@storybook/vue3";
import AuthBrandPanel from "./AuthBrandPanel.vue";

const meta: Meta<typeof AuthBrandPanel> = {
  title: "Auth/AuthBrandPanel",
  component: AuthBrandPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Left-side branding panel for the split auth layout. Static — no props.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthBrandPanel>;

export const Default: Story = {};
