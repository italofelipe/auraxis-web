import type { Meta, StoryObj } from "@storybook/vue3";
import UiOptionCardRadio from "./UiOptionCardRadio.vue";

const meta: Meta<typeof UiOptionCardRadio> = {
  title: "Design System/UiOptionCardRadio",
  component: UiOptionCardRadio,
  tags: ["autodocs"],
  argTypes: {
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiOptionCardRadio>;

export const Default: Story = {
  args: {
    option: { id: 1, text: "Preservar meu patrimônio", points: 1 },
    selected: false,
  },
};

export const Selected: Story = {
  args: {
    option: { id: 2, text: "Crescimento moderado", points: 2 },
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    option: { id: 3, text: "Maximizar a rentabilidade", points: 3 },
    selected: false,
    disabled: true,
  },
};

export const DisabledSelected: Story = {
  args: {
    option: { id: 1, text: "Preservar meu patrimônio", points: 1 },
    selected: true,
    disabled: true,
  },
};
