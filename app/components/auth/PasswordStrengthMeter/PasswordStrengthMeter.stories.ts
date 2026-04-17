import type { Meta, StoryObj } from "@storybook/vue3";
import PasswordStrengthMeter from "./PasswordStrengthMeter.vue";

const meta: Meta<typeof PasswordStrengthMeter> = {
  title: "Auth/PasswordStrengthMeter",
  component: PasswordStrengthMeter,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Visual password strength indicator with checklist criteria (length, uppercase, number, special char).",
      },
    },
  },
  argTypes: {
    password: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordStrengthMeter>;

export const Empty: Story = {
  name: "Empty password",
  args: { password: "" },
};

export const Weak: Story = {
  name: "Weak (length only)",
  args: { password: "abcdefghij" }, // eslint-disable-line sonarjs/no-hardcoded-passwords -- storybook demo value
};

export const Medium: Story = {
  name: "Medium (length + uppercase)",
  args: { password: "Abcdefghij" }, // eslint-disable-line sonarjs/no-hardcoded-passwords -- storybook demo value
};

export const Strong: Story = {
  name: "Strong (all criteria)",
  args: { password: "Abcdefgh1!" }, // eslint-disable-line sonarjs/no-hardcoded-passwords -- storybook demo value
};
