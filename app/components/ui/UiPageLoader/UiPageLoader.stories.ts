import type { Meta, StoryObj } from "@storybook/vue3";
import UiPageLoader from "./UiPageLoader.vue";

const meta: Meta<typeof UiPageLoader> = {
  title: "UI/UiPageLoader",
  component: UiPageLoader,
  tags: ["autodocs"],
  argTypes: {
    rows: { control: { type: "number", min: 1, max: 10 } },
    withTitle: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiPageLoader>;

export const Default: Story = {
  args: { rows: 3, withTitle: false },
};

export const WithTitle: Story = {
  args: { rows: 3, withTitle: true },
};

export const SingleRow: Story = {
  args: { rows: 1, withTitle: false },
};

export const ManyRows: Story = {
  args: { rows: 6, withTitle: true },
};
