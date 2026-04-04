import type { Meta, StoryObj } from "@storybook/vue3";
import UiPublicFooter from "./UiPublicFooter.vue";

const meta: Meta<typeof UiPublicFooter> = {
  title: "Design System/UiPublicFooter",
  component: UiPublicFooter,
  tags: ["autodocs"],
  argTypes: {
    year: { control: "number" },
  },
};

export default meta;

type Story = StoryObj<typeof UiPublicFooter>;

export const Default: Story = {
  args: {},
};

export const CustomYear: Story = {
  args: { year: 2025 },
};
