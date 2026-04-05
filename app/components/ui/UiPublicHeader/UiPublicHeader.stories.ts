import type { Meta, StoryObj } from "@storybook/vue3";
import UiPublicHeader from "./UiPublicHeader.vue";

const meta: Meta<typeof UiPublicHeader> = {
  title: "Design System/UiPublicHeader",
  component: UiPublicHeader,
  tags: ["autodocs"],
  argTypes: {
    authenticated: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiPublicHeader>;

export const Unauthenticated: Story = {
  args: { authenticated: false },
};

export const Authenticated: Story = {
  args: { authenticated: true },
};
