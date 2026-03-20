import type { Meta, StoryObj } from "@storybook/vue3";
import UiSocialAuthButtons from "./UiSocialAuthButtons.vue";

const meta: Meta<typeof UiSocialAuthButtons> = {
  title: "Shared/UiSocialAuthButtons",
  component: UiSocialAuthButtons,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    compact: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiSocialAuthButtons>;

export const Default: Story = {
  args: { disabled: false, compact: false },
};

export const Compact: Story = {
  args: { compact: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
