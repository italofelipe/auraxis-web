import type { Meta, StoryObj } from "@storybook/vue3";
import BaseSkeleton from "./BaseSkeleton.vue";

const meta: Meta<typeof BaseSkeleton> = {
  title: "Design System/BaseSkeleton",
  component: BaseSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Canonical loading skeleton with variants: text, line, block, button, circle. Supports repeat for list placeholders.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["text", "line", "block", "button", "circle"] },
    height: { control: "text" },
    width: { control: "text" },
    size: { control: "text" },
    repeat: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof BaseSkeleton>;

export const Line: Story = {
  args: { variant: "line", width: "200px" },
};

export const Text: Story = {
  args: { variant: "text", width: "80%" },
};

export const Block: Story = {
  args: { variant: "block", width: "100%", height: "120px" },
};

export const Button: Story = {
  args: { variant: "button" },
};

export const Circle: Story = {
  args: { variant: "circle", size: "48px" },
};

export const RepeatedList: Story = {
  name: "Repeated (list placeholder)",
  args: { variant: "line", repeat: 5, width: "100%" },
};
