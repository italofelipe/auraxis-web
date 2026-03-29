import type { Meta, StoryObj } from "@storybook/vue3";
import UiWizardProgress from "./UiWizardProgress.vue";

const meta: Meta<typeof UiWizardProgress> = {
  title: "Design System/UiWizardProgress",
  component: UiWizardProgress,
  tags: ["autodocs"],
  argTypes: {
    current: { control: { type: "number", min: 1 } },
    total: { control: { type: "number", min: 1 } },
  },
};

export default meta;

type Story = StoryObj<typeof UiWizardProgress>;

export const Step1of5: Story = {
  args: {
    current: 1,
    total: 5,
  },
};

export const Step3of5: Story = {
  args: {
    current: 3,
    total: 5,
  },
};

export const LastStep: Story = {
  args: {
    current: 5,
    total: 5,
  },
};

export const SingleStep: Story = {
  args: {
    current: 1,
    total: 1,
  },
};
